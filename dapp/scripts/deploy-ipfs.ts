// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
import fs from 'fs';
import path from 'path';

import axios from 'axios';
import {create, globSource} from 'ipfs-http-client';

// ============================== IPFS ==============================

async function deployToIpfs(
    projectId: string,
    projectSecret: string,
): Promise<string> {
    const buildDir = 'build';

    if (!fs.existsSync(buildDir))
        throw new Error(
            "Build directory doesn't exist. You need to build first!",
        );

    const auth = Buffer.from([projectId, projectSecret].join(':')).toString(
        'base64',
    );

    const ipfs = await create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
            authorization: `Basic ${auth}`,
        },
    });

    let baseIpfsCid = '';
    const indexHtmlPath = path.join(buildDir, 'index.html');

    for await (const file of ipfs.addAll(globSource(buildDir, '*'), {
        wrapWithDirectory: true,
    })) {
        console.log(`[${file.path || 'ipfs-cid'}]: ${file.cid}`);
        if (!file.path) baseIpfsCid = file.cid.toString();
    }

    const indexHtml = getIndexHtml(indexHtmlPath, baseIpfsCid);
    const result = await ipfs.add(indexHtml);

    return result.cid.toString();
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

// ============================== GitLab ==============================

// GitLab `panther-core` project ID
const PC_PROJECT_ID = '32154473';
const ipfsCommentFlag = '____ipfs_deploy_comment';

export function setupAxios(gitLabAccessToken: string) {
    axios.defaults.headers.common['PRIVATE-TOKEN'] = gitLabAccessToken;
    axios.defaults.baseURL = 'https://gitlab.com/api/v4';
}

function makeCommentBody(ipfsCid: string, builds: Build[]): string {
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
                    `[${build.ipfsCid}](${makeIpfsUrl(build.ipfsCid)})`,
                ].join(' '),
            )
            .join('\n'),
        `</details>`,
        // A flag to mark the ipfs comment. Will not be visible.
        `[](${ipfsCommentFlag})`,
        `[  ](${serializeBuilds(builds)})`,
    ].join('\n\n');
}

async function makeGitLabComment(
    mergeReqId: string,
    ipfsCid: string,
    build: Build,
): Promise<void> {
    await axios.post(
        `/projects/${PC_PROJECT_ID}/merge_requests/${mergeReqId}/notes`,
        null,
        {
            params: {
                body: makeCommentBody(ipfsCid, [build]),
            },
        },
    );
}

type Comment = {
    id: number;
    body: string;
};

async function getPreviousIpfsComment(
    mergeReqId: string,
): Promise<Comment | null> {
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
    ipfsCid: string,
    builds: Build[],
): Promise<void> {
    await axios.put(
        `/projects/${PC_PROJECT_ID}/merge_requests/${mergeReqId}/notes/${commentId}`,
        null,
        {
            params: {
                body: makeCommentBody(ipfsCid, builds),
            },
        },
    );
}

type EnvVars = Record<
    | 'gitLabAccessToken'
    | 'projectId'
    | 'projectSecret'
    | 'mergeReqId'
    | 'commitShaShort',
    string
>;
function getEnvVariables(): EnvVars {
    const envVars: EnvVars = {
        gitLabAccessToken: 'GITLAB_ACCESS_TOKEN',
        projectId: 'INFURA_PROJECT_ID',
        projectSecret: 'INFURA_PROJECT_SECRET_ID',
        mergeReqId: 'CI_MERGE_REQUEST_IID',
        commitShaShort: 'CI_COMMIT_SHORT_SHA',
    };

    const missingEnvVars: string[] = [];

    Object.values(envVars).forEach((envVar: string) => {
        if (!process.env[envVar]) {
            missingEnvVars.push(envVar);
        }
    });

    if (missingEnvVars.length != 0) {
        console.error(
            `Missing these environment variable:\n${missingEnvVars.join('\n')}`,
        );
        process.exit(1);
    }

    for (const [key, value] of Object.entries<string>(envVars)) {
        envVars[key as keyof EnvVars] = process.env[value]!;
    }
    return envVars;
}

// ============================== serialize/deserialize ==============================

type Build = {
    commitShaShort: string;
    ipfsCid: string;
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
        builds.map(build => [
            build.commitShaShort,
            build.ipfsCid,
            build.createdAt.getTime(),
        ]),
    );
}

// Parse builds string into JS objects
function deserializeBuilds(buildsStr: string): Build[] {
    const builds = JSON.parse(buildsStr) as Array<
        [
            string, // commitShaShort
            string, // ipfsCid
            number, // createdAt: timestamp
        ]
    >;
    return builds.map(build => ({
        commitShaShort: build[0],
        ipfsCid: build[1],
        createdAt: new Date(build[2]),
    }));
}

// ============================== Utils ==============================
function makeIpfsUrl(ipfsCid: string): string {
    return `https://ipfs.io/ipfs/${ipfsCid}/`;
}

// ============================== Entery Point  ==============================
async function main() {
    const envVars = getEnvVariables();
    setupAxios(envVars.gitLabAccessToken);

    const [ipfsCid, comment] = await Promise.all([
        deployToIpfs(envVars.projectId, envVars.projectSecret),
        getPreviousIpfsComment(envVars.mergeReqId),
    ]);

    if (comment === null) {
        return await makeGitLabComment(envVars.mergeReqId, ipfsCid, {
            commitShaShort: envVars.commitShaShort,
            ipfsCid,
            createdAt: new Date(),
        });
    }

    const builds = getPreviousBuilds(comment.body);
    builds.push({
        commitShaShort: envVars.commitShaShort,
        ipfsCid,
        createdAt: new Date(),
    });
    await updateGitLabComment(envVars.mergeReqId, comment.id, ipfsCid, builds);
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.log(err);
        process.exit(1);
    });
