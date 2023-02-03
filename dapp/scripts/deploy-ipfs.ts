// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
import fs from 'fs';
import path from 'path';

import axios from 'axios';
import {create, globSource} from 'ipfs-http-client';

// ============================== IPFS ==============================

function getAuthHeader(projectId: string, projectSecret: string): string {
    const auth = Buffer.from([projectId, projectSecret].join(':')).toString(
        'base64',
    );

    return `Basic ${auth}`;
}

async function deployToIpfs(
    projectId: string,
    projectSecret: string,
): Promise<{indexHtmlCid: string; rootDirCid: string}> {
    const buildDir = 'build';

    if (!fs.existsSync(buildDir))
        throw new Error(
            "Build directory doesn't exist. You need to build first!",
        );

    const ipfs = await create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
            authorization: getAuthHeader(projectId, projectSecret),
        },
    });

    // Root Directory where all the content of the `build/` dir lives
    let rootDirCid = '';
    const indexHtmlPath = path.join(buildDir, 'index.html');

    for await (const file of ipfs.addAll(globSource(buildDir, '*'), {
        wrapWithDirectory: true,
    })) {
        console.log(`[${file.path || 'ipfs-cid'}]: ${file.cid}`);
        if (!file.path) rootDirCid = file.cid.toString();
    }

    const indexHtml = getIndexHtml(indexHtmlPath, rootDirCid);
    const result = await ipfs.add(indexHtml);

    return {indexHtmlCid: result.cid.toString(), rootDirCid};
}

function getIndexHtml(indexHtmlPath: string, baseIpfsCid: string) {
    const html = fs.readFileSync(indexHtmlPath).toString();
    const fileToUrl = (file: string) =>
        `"https://ipfs.io/ipfs/${baseIpfsCid}/${file}"`;
    const filesToReplace = [
        'circomlib.js',
        'main.js',
        'vendor-react.js',
        'logo.png',
    ];

    return filesToReplace.reduce(
        (acc, curr) => acc.replaceAll(`"${curr}"`, fileToUrl(curr)),
        html,
    );
}

// Unpin endpoint from Infura
// https://docs.infura.io/infura/networks/ipfs/http-api-methods/pin_rm#api-v0-pin-rm
async function unpinBuild(
    projectId: string,
    projectSecret: string,
    ipfsCid: string,
): Promise<void> {
    try {
        await axios.post('https://ipfs.infura.io:5001/api/v0/pin/rm', null, {
            params: {
                arg: ipfsCid,
            },
            headers: {
                authorization: getAuthHeader(projectId, projectSecret),
            },
        });
    } catch (error) {
        const data = axios.isAxiosError(error)
            ? error.response?.data
            : error instanceof Error
            ? error.message
            : error;

        console.log({
            message: `Unable to unpin from ipfs ${ipfsCid}`,
            data: data,
        });
    }
}

async function unpinAll(
    projectId: string,
    projectSecret: string,
    builds: Build[],
): Promise<void> {
    if (builds.length == 0) return;

    console.log(
        `Will unpin all these builds: ${JSON.stringify(builds, null, 2)}`,
    );

    const cids: string[] = builds
        .map((build: Build) =>
            build.rootDirCid
                ? [build.indexHtmlCid, build.rootDirCid]
                : [build.indexHtmlCid],
        )
        .reduce((acc, curr) => acc.concat(curr), []);

    await Promise.all(
        cids.map((cid: string) => unpinBuild(projectId, projectSecret, cid)),
    );
}

// ============================== GitLab ==============================

// GitLab `panther-core` project ID
const PC_PROJECT_ID = '32154473';
const ipfsCommentFlag = '____ipfs_deploy_comment';

export function setupAxios(gitLabAccessToken: string) {
    axios.defaults.headers.common['PRIVATE-TOKEN'] = gitLabAccessToken;
    axios.defaults.baseURL = 'https://gitlab.com/api/v4';
}

function makeCommentBody(
    ipfsCid: string,
    builds: Build[],
    markCommentAsUnpinned = false,
): string {
    return [
        `#### Your latest IPFS build can be accessed from [here](${makeIpfsUrl(
            ipfsCid,
        )}) 🔥`,
        `<details>`,
        `<summary>Previous Builds</summary>`,
        builds
            .map(build =>
                [
                    '-',
                    build.commitShaShort,
                    `(${build.createdAt.toUTCString()})`,
                    ':',
                    `[${build.indexHtmlCid}](${makeIpfsUrl(
                        build.indexHtmlCid,
                    )})`,
                ].join(' '),
            )
            .join('\n'),
        `</details>`,
        markCommentAsUnpinned
            ? `📛 Note that the links above are **unpinned** at *${new Date().toUTCString()}* **(may not be accessible anymore)** 📛`
            : '',
        // A flag to mark the ipfs comment. Will not be visible.
        `[](${ipfsCommentFlag})`,
        `[  ](${serializeBuilds(builds)})`,
    ].join('\n\n');
}

async function makeGitLabComment(
    mergeReqId: string,
    body: string,
): Promise<void> {
    await axios.post(
        `/projects/${PC_PROJECT_ID}/merge_requests/${mergeReqId}/notes`,
        null,
        {
            params: {
                body,
            },
        },
    );
}

type Comment = {
    id: number;
    body: string;
};

async function getPreviousComment(mergeReqId: string): Promise<Comment | null> {
    const {data} = await axios.get<Comment[]>(
        `/projects/${PC_PROJECT_ID}/merge_requests/${mergeReqId}/notes`,
    );
    const comments = data
        .filter(comment => comment.body.includes(ipfsCommentFlag))
        .map(comment => ({id: comment.id, body: comment.body}));

    if (comments.length === 0) return null;

    if (comments.length != 1)
        throw new Error('Only one comment GitLab is allowed');

    return comments[0];
}

async function updateGitLabComment(
    mergeReqId: string,
    commentId: number,
    body: string,
): Promise<void> {
    await axios.put(
        `/projects/${PC_PROJECT_ID}/merge_requests/${mergeReqId}/notes/${commentId}`,
        null,
        {
            params: {
                body,
            },
        },
    );
}

type EnvVars = Record<
    | 'gitLabAccessToken'
    | 'projectId'
    | 'projectSecret'
    | 'mergeReqId'
    | 'commitShaShort'
    | 'fullCommitMessage',
    string
>;
function getEnvVariables(): EnvVars {
    const envVars = {
        gitLabAccessToken: 'GITLAB_ACCESS_TOKEN',
        projectId: 'INFURA_PROJECT_ID',
        projectSecret: 'INFURA_PROJECT_SECRET_ID',
        commitShaShort: 'CI_COMMIT_SHORT_SHA',
        fullCommitMessage: 'CI_COMMIT_MESSAGE',
    };

    const missingEnvVars: string[] = [];

    Object.values(envVars).forEach((envVar: string) => {
        if (!process.env[envVar]) {
            missingEnvVars.push(envVar);
        }
    });

    if (missingEnvVars.length != 0) {
        throw new Error(
            `Missing these environment variable:\n${missingEnvVars.join('\n')}`,
        );
    }

    for (const [key, value] of Object.entries<string>(envVars)) {
        envVars[key as keyof typeof envVars] = process.env[value]!;
    }

    const mergeReqId = getMergeReqId(envVars.fullCommitMessage);
    if (mergeReqId == null) throw new Error('Merge request ID is missing');

    return {
        ...envVars,
        mergeReqId,
    };
}

// ============================== serialize/deserialize ==============================

type Build = {
    commitShaShort: string;
    indexHtmlCid: string;
    rootDirCid: string | null;
    createdAt: Date;
};

/*
 * RegExp to extract preivous builds from the comment body
 * View on regex101: https://regex101.com/r/PxdlHd/1
 * Builds are encoded in JSON string with an empty link (2 spaces)
 * Example:
 *  [  ]([[commit_sha_1, url_1], [commit_sha_2, url_2]])
 */
const reBuilds = /\[\s\s\]\((.+)\)/;
function getPreviousBuilds(body: string): Build[] {
    const buildsStr = body.match(reBuilds);
    if (!buildsStr || !buildsStr[1]) return [];
    try {
        return deserializeBuilds(buildsStr[1]);
    } catch (err) {
        console.log(`Invalid JSON:\n${err}\n${buildsStr[1]}`);
        return [];
    }
}

// Convert build objects into a string with a compact format
function serializeBuilds(builds: Build[]): string {
    return JSON.stringify(
        builds.map(build => {
            //! For backward compatibility old builds have only [commitShaShort, indexHtmlCid, createdAt]
            //! Should be removed after closing all currently opened PRs.
            if (build.rootDirCid == null)
                return [
                    build.commitShaShort,
                    build.indexHtmlCid,
                    build.createdAt.getTime(),
                ];

            return [
                build.commitShaShort,
                build.rootDirCid,
                build.indexHtmlCid,
                build.createdAt.getTime(),
            ];
        }),
    );
}

// Parse builds string into JS objects
function deserializeBuilds(buildsStr: string): Build[] {
    const builds = JSON.parse(buildsStr) as Array<
        | [
              string, // commitShaShort
              string, // rootDirCid
              string, // ipfsCid
              number, // createdAt: timestamp
          ]
        | [
              // Old serialization
              string, // commitShaShort
              string, // indexHtmlCid
              number, // createdAt
          ]
    >;

    //! For backward compatibility old builds have only [commitShaShort, indexHtmlCid, createdAt]
    //! Should be removed after closing all currently opened PRs.
    return builds.map(build => {
        if (build.length === 3)
            return {
                commitShaShort: build[0],
                indexHtmlCid: build[1],
                createdAt: new Date(build[2]),
                rootDirCid: null,
            };

        return {
            commitShaShort: build[0],
            rootDirCid: build[1],
            indexHtmlCid: build[2],
            createdAt: new Date(build[3]),
        };
    });
}

/*
 * RegExp to extract current module from the commit title
 * View on regex101: https://regex101.com/r/rTxEQA/1
 * Modules: dapp, graph, crypto, contracts
 * Example:
 *  - feat(dapp): deploy to IPFS from CI/CD
 *  - refactor(dapp): use gradient instead of image
 */
const reModule = /.+\((.+)\)\s?:\s?/;
export function getModule(commitTitle: string): string | null {
    const result = commitTitle.match(reModule);
    if (!result) return null;
    return result[1];
}

/*
 * RegExp to extract merge request ID from the commit message
 * View on regex101: https://regex101.com/r/3MEB32/1 
 * Merge Request ID: number (eg: 822, 900, 101)
 * Example:
 *  - Merge branch 'ahmed/ipfs-prev-builds' into 'main'
      feat(dapp): keep previous builds on IPFS for every MR
      See merge request !901  <--- Merge Request ID
 */
const reMergeId = /See merge request.*!(.*)/;
/**
 * There are two places to get the merge request ID
 * - From the `CI_MERGE_REQUEST_IID` environment variable
 * - From the merge commit message when merging ito `main` (like the one example above)
 */
function getMergeReqId(fullCommitMsg: string): string | null {
    const mergeReqId = process.env['CI_MERGE_REQUEST_IID'];
    if (mergeReqId) return mergeReqId;

    const reMatch = fullCommitMsg.match(reMergeId);
    if (!reMatch) return null;
    return reMatch[1];
}

// ============================== Utils ==============================
function makeIpfsUrl(ipfsCid: string): string {
    return `https://ipfs.io/ipfs/${ipfsCid}/`;
}

// ============================== Entry Point  ==============================
/**
 *  ### Script entry point (`deploy-ipfs.ts`)
 *  This script can be run in two ways
 *  1. `ts-node scripts/deploy-ipfs.ts`: will deploy the current `build`
 *     directory to ipfs and make a comment with the ipfs link on GitLab
 *  2. `ts-node scripts/deploy-ipfs.ts --unpin` (with the unpin flag) will unpin
 *     all ipfs files that was made for this merge request
 */
async function main() {
    const envVars = getEnvVariables();
    setupAxios(envVars.gitLabAccessToken);

    const prevComment = await getPreviousComment(envVars.mergeReqId);
    const shouldUnpinBuilds = process.argv.includes('--unpin');

    if (shouldUnpinBuilds) {
        if (prevComment == null)
            return console.log(
                `Merge Reqeust (!${envVars.mergeReqId}) has no comments related to ipfs. Nothing to unpin`,
            );

        const builds = getPreviousBuilds(prevComment.body);
        await unpinAll(envVars.projectId, envVars.projectSecret, builds);
        const lastBuild = builds[builds.length - 1];
        const body = makeCommentBody(
            lastBuild ? lastBuild.indexHtmlCid : '',
            builds,
            true, // Mark comment as unpinned
        );
        await updateGitLabComment(envVars.mergeReqId, prevComment.id, body);

        return;
    }

    const modulesToWatch = ['dapp', 'crypto'];
    const module = getModule(envVars.fullCommitMessage);

    if (!module) throw new Error('Module not found. Invalid commit title');
    if (!modulesToWatch.includes(module))
        return console.log(
            `Info: Script will not run for the '${module}' moudle`,
        );

    const {indexHtmlCid, rootDirCid} = await deployToIpfs(
        envVars.projectId,
        envVars.projectSecret,
    );

    const newBuild = {
        commitShaShort: envVars.commitShaShort,
        indexHtmlCid,
        rootDirCid,
        createdAt: new Date(),
    };

    if (prevComment === null) {
        const body = makeCommentBody(indexHtmlCid, [newBuild]);
        return await makeGitLabComment(envVars.mergeReqId, body);
    }

    const builds = getPreviousBuilds(prevComment.body);
    builds.push(newBuild);
    const body = makeCommentBody(indexHtmlCid, builds);
    await updateGitLabComment(envVars.mergeReqId, prevComment.id, body);
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.log(err);
        process.exit(1);
    });
