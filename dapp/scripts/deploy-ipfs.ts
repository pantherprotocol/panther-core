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

function buildCommentBody(ipfsCid: string) {
    return [
        `#### Your latest IPFS build can be accessed from [here](https://ipfs.io/ipfs/${ipfsCid}/) 🔥`,
        `<details><summary>IPFS CID</summary> \n\n\n **IPFS CID:** *${ipfsCid}* </details>`,
        // A flag to mark the ipfs comment. Will not be visible.
        `[](${ipfsCommentFlag})`,
    ].join('\n');
}

async function makeGitLabComment(mergeReqId: number, ipfsCid: string) {
    await axios.post(
        `/projects/${PC_PROJECT_ID}/merge_requests/${mergeReqId}/notes`,
        null,
        {
            params: {
                body: buildCommentBody(ipfsCid),
            },
        },
    );
}

type Comment = {
    id: number;
    body: string;
};

async function getPreviousIpfsComment(
    mergeReqId: number,
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
    mergeReqId: number,
    commentId: number,
    ipfsCid: string,
): Promise<void> {
    await axios.put(
        `/projects/${PC_PROJECT_ID}/merge_requests/${mergeReqId}/notes/${commentId}`,
        null,
        {
            params: {
                body: buildCommentBody(ipfsCid),
            },
        },
    );
}

function getEnvVariables(): {
    gitLabAccessToken: string;
    projectId: string;
    projectSecret: string;
    mergeReqId: number;
} {
    const requiredEnvVars: string[] = [
        'GITLAB_ACCESS_TOKEN',
        'INFURA_PROJECT_ID',
        'INFURA_PROJECT_SECRET_ID',
        'CI_MERGE_REQUEST_IID',
    ];

    const missingEnvVars: string[] = [];

    requiredEnvVars.forEach(envVar => {
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

    return {
        gitLabAccessToken: process.env['GITLAB_ACCESS_TOKEN']!,
        projectId: process.env['INFURA_PROJECT_ID']!,
        projectSecret: process.env['INFURA_PROJECT_SECRET_ID']!,
        mergeReqId: Number(process.env['CI_MERGE_REQUEST_IID']),
    };
}

async function main() {
    const envVars = getEnvVariables();

    setupAxios(envVars.gitLabAccessToken);

    const ipfsCid = await deployToIpfs(
        envVars.projectId,
        envVars.projectSecret,
    );

    const comment = await getPreviousIpfsComment(envVars.mergeReqId);

    if (comment === null) {
        await makeGitLabComment(envVars.mergeReqId, ipfsCid);
    } else {
        await updateGitLabComment(envVars.mergeReqId, comment.id, ipfsCid);
    }
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.log(err);
        process.exit(1);
    });
