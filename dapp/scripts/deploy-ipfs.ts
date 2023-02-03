// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
import fs from 'fs';
import path from 'path';

import axios from 'axios';
import dotenv from 'dotenv';
import {create, globSource} from 'ipfs-http-client';

//! Note: this script must be run from the `dapp/` directory directly.
// Load .env file from dapp/.env
dotenv.config({});

// ============================== IPFS ==============================

function getInfuraAuthHeader(): string {
    const projectId = getEnvVarOrFail<string>(EnvVar.ProjectId);
    const projectSecret = getEnvVarOrFail<string>(EnvVar.ProjectSecret);

    const auth = Buffer.from([projectId, projectSecret].join(':')).toString(
        'base64',
    );

    return `Basic ${auth}`;
}

type HttpProtocol = 'http' | 'https';
type IpfsNodeInfo = {
    host: string;
    protocol: HttpProtocol;
    port: number;
    headers: {[key: string]: string};
};

function makeInfuraNode(): IpfsNodeInfo {
    return {
        host: 'ipfs.infura.io',
        protocol: 'https',
        port: 5001,
        headers: {
            authorization: getInfuraAuthHeader(),
        },
    };
}

function makeDefaultLocalIpfs(): IpfsNodeInfo {
    return {
        host: '127.0.0.1',
        protocol: 'http',
        port: 5001,
        headers: {},
    };
}

function makeCustomIpfsNode(): IpfsNodeInfo {
    const host = getEnvVarOrFail<string>(EnvVar.IfpsHost);
    const protocol = getEnvVarOrFail<HttpProtocol>(EnvVar.IpfsProtocol);
    const port = Number(getEnvVarOrFail<number>(EnvVar.IpfsPort));

    if (protocol != 'http' && protocol !== 'https')
        throw new Error(
            `"${protocol}" is not a valid protocol. Must be http or https`,
        );

    if (Number.isNaN(port))
        throw new Error(`"${port}" is not valid port. Must be a number`);

    return {
        host,
        protocol,
        port,
        headers: {},
    };
}

function getIpfsNode(
    useInfuraNode: boolean,
    useCustomNode: boolean,
): IpfsNodeInfo {
    if (useInfuraNode) return makeInfuraNode();
    if (useCustomNode) return makeCustomIpfsNode();
    // Default to local ipfs node if no other option
    return makeDefaultLocalIpfs();
}

async function deployToIpfs(
    ipfsNode: IpfsNodeInfo,
): Promise<{indexHtmlCid: string; rootDirCid: string}> {
    const buildDir = 'build';

    if (!fs.existsSync(buildDir))
        throw new Error(
            "Build directory doesn't exist. You need to build first!",
        );

    const ipfs = await create(ipfsNode);

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
    const indexHtmlCid = result.cid.toString();

    console.log(`#>> Your build is deployed to ${makeIpfsUrl(indexHtmlCid)}`);
    console.log(`#>> Index.html CID: ipfs://${indexHtmlCid}`);
    console.log(`#>> Build Direcoty: ipfs://${rootDirCid}`);

    return {indexHtmlCid, rootDirCid};
}

function getIndexHtml(indexHtmlPath: string, baseIpfsCid: string) {
    const html = fs.readFileSync(indexHtmlPath).toString();
    const fileToUrl = (file: string, withQuotes = true) => {
        const wrapper = withQuotes ? '"' : '';
        return `${wrapper}https://ipfs.io/ipfs/${baseIpfsCid}/${file}${wrapper}`;
    };

    const filesToReplace = [
        'circomlib.js',
        'main.js',
        'vendor-react.js',
        'logo.png',
    ];

    let updatedHtml = filesToReplace.reduce(
        (acc, curr) => acc.replaceAll(`"${curr}"`, fileToUrl(curr)),
        html,
    );

    // map `%PUBLIC_URL%/logo.png` -> `<IPFS_LINK>/logo.png`
    updatedHtml = updatedHtml.replace(
        '"%PUBLIC_URL%/logo.png"',
        fileToUrl('logo.png'),
    );

    // map `/manifest.<RANDOM_HASH>` -> `<IPFS_LINK>/manifest.<HASH>`
    updatedHtml = updatedHtml.replace(
        '/manifest.',
        fileToUrl('manifest.', false),
    );

    return updatedHtml;
}

// Unpin endpoint from Infura
// https://docs.infura.io/infura/networks/ipfs/http-api-methods/pin_rm#api-v0-pin-rm
async function unpinBuild(ipfsCid: string): Promise<void> {
    try {
        await axios.post('https://ipfs.infura.io:5001/api/v0/pin/rm', null, {
            params: {
                arg: ipfsCid,
            },
            headers: {
                authorization: getInfuraAuthHeader(),
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

async function unpinAll(builds: Build[]): Promise<void> {
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

    await Promise.all(cids.map((cid: string) => unpinBuild(cid)));
}

// ============================== GitLab ==============================

// GitLab `panther-core` project ID
const PC_PROJECT_ID = '32154473';
const ipfsCommentFlag = '____ipfs_deploy_comment';

export function setupAxios() {
    axios.defaults.headers.common['PRIVATE-TOKEN'] = getEnvVarOrFail(
        EnvVar.GitLabAccessToken,
    );
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
 * RegExp to extract current workspace from the commit title
 * View on regex101: https://regex101.com/r/rTxEQA/1
 * workspaces: dapp, graph, crypto, contracts
 * Example:
 *  - feat(dapp): deploy to IPFS from CI/CD
 *  - refactor(dapp): use gradient instead of image
 */
const reWorkspace = /.+\((.+)\)\s?:\s?/;
export function getWorkspace(commitTitle: string): string | null {
    const result = commitTitle.match(reWorkspace);
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
function getMergeReqIdOrFail(fullCommitMsg: string): string {
    const mergeReqId = process.env['CI_MERGE_REQUEST_IID'];
    if (mergeReqId) return mergeReqId;

    console.warn(
        `Missing 'CI_MERGE_REQUEST_IID' environment variable. Will try to get it from the commit message!`,
    );

    const reMatch = fullCommitMsg.match(reMergeId);
    if (!reMatch) {
        throw new Error(
            `Invlaid Commit Message. Cannot extract merge request ID. Commit Message: ${fullCommitMsg}`,
        );
    }

    return reMatch[1];
}

// ============================== CI/CD ==============================

async function handleCi(
    shouldUnpinBuilds: boolean,
    useInfura: boolean,
    useCustomNode: boolean,
) {
    setupAxios();
    const fullCommitMessage = getEnvVarOrFail(EnvVar.FullCommitMessage);
    const mergeReqId = getMergeReqIdOrFail(fullCommitMessage);
    const prevComment = await getPreviousComment(mergeReqId);

    if (shouldUnpinBuilds) {
        if (prevComment == null)
            return console.log(
                `Merge Reqeust (!${mergeReqId}) has no comments related to ipfs. Nothing to unpin`,
            );

        const builds = getPreviousBuilds(prevComment.body);
        await unpinAll(builds);

        const lastBuild = builds[builds.length - 1];
        const body = makeCommentBody(
            lastBuild ? lastBuild.indexHtmlCid : '',
            builds,
            true, // Mark comment as unpinned
        );
        return await updateGitLabComment(mergeReqId, prevComment.id, body);
    }

    const allowedWorkspaces = ['dapp', 'crypto'];
    const workspace = getWorkspace(fullCommitMessage);

    if (!workspace)
        throw new Error('Workspace not found. Invalid commit title');
    if (!allowedWorkspaces.includes(workspace))
        return console.log(
            `Info: Script will not run for the '${workspace}' workspace`,
        );

    const {indexHtmlCid, rootDirCid} = await deployToIpfs(
        getIpfsNode(useInfura, useCustomNode),
    );

    const newBuild = {
        commitShaShort: getEnvVarOrFail(EnvVar.CommitShaShort),
        indexHtmlCid,
        rootDirCid,
        createdAt: new Date(),
    };

    if (prevComment === null) {
        const body = makeCommentBody(indexHtmlCid, [newBuild]);
        return await makeGitLabComment(mergeReqId, body);
    }

    const builds = getPreviousBuilds(prevComment.body);
    builds.push(newBuild);
    const body = makeCommentBody(indexHtmlCid, builds);
    await updateGitLabComment(mergeReqId, prevComment.id, body);
}

// ============================== Utils ==============================
function makeIpfsUrl(ipfsCid: string): string {
    return `https://ipfs.io/ipfs/${ipfsCid}/`;
}

function getFlag(flag: string): boolean {
    return process.argv.includes(flag);
}

enum EnvVar {
    GitLabAccessToken = 'GITLAB_ACCESS_TOKEN',
    ProjectId = 'INFURA_PROJECT_ID',
    ProjectSecret = 'INFURA_PROJECT_SECRET_ID',
    CommitShaShort = 'CI_COMMIT_SHORT_SHA',
    FullCommitMessage = 'CI_COMMIT_MESSAGE',
    MergeReqId = 'CI_MERGE_REQUEST_IID',
    IfpsHost = 'IPFS_HOST',
    IpfsPort = 'IPFS_PORT',
    IpfsProtocol = 'IPFS_PROTOCOL',
}

function getEnvVarOrFail<T = string>(envVar: EnvVar): T {
    const value = process.env[envVar];
    if (!value) throw new Error(`Missing '${envVar}' environment variable`);
    return value as T;
}

// ============================== Entry Point  ==============================
async function main() {
    const fromCi = getFlag('--ci');
    const withInfuraNode = getFlag('--infura');
    const withCustomNode = getFlag('--custom');
    const withDefaultLocalNode = getFlag('--local-default');
    //! Note: `--unpin` flag can be used only from the CI/CD
    const shouldUnpinBuilds = getFlag('--unpin');
    let ipfsNode: IpfsNodeInfo | null = null;
    if (withDefaultLocalNode) ipfsNode = makeDefaultLocalIpfs();
    if (withInfuraNode && !fromCi) ipfsNode = makeInfuraNode();
    if (withCustomNode && !fromCi) ipfsNode = makeCustomIpfsNode();
    if (ipfsNode !== null) return await deployToIpfs(ipfsNode);
    if (fromCi)
        return await handleCi(
            shouldUnpinBuilds,
            withInfuraNode,
            withCustomNode,
        );
    throw new Error('No flag provided Or Invalid Flag. Please read the docs');
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.log(err);
        process.exit(1);
    });
