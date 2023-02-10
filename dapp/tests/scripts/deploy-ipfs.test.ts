import fs from 'fs';

import {expect} from 'chai';

import {
    makeIpfsUrl,
    EnvVar,
    getInfuraAuthHeader,
    makeInfuraNode,
    makeDefaultLocalIpfs,
    makeCustomIpfsNode,
    getIpfsNode,
    getIndexHtml,
    makeCommentBody,
    getPreviousBuilds,
    serializeBuilds,
    deserializeBuilds,
    getWorkspace,
    getMergeReqIdOrFail,
    getFlag,
    getEnvVarOrFail,
} from '../../scripts/deploy-ipfs';

const projectId = 'test_project_id';
const projectSecret = 'test_project_secret';

describe('IPFS Deployment Script', () => {
    const env = process.env;
    const argv = process.argv;

    beforeEach(() => {
        jest.resetModules();

        process.env = {...env};
        process.env[EnvVar.ProjectId] = projectId;
        process.env[EnvVar.ProjectSecret] = projectSecret;
        process.argv = [...argv];
    });

    afterEach(() => {
        process.env = env;
        process.argv = argv;
    });

    describe('Infura node info', () => {
        it('should generate infura auth header', () => {
            const auth = Buffer.from(
                [projectId, projectSecret].join(':'),
            ).toString('base64');
            const authHeader = getInfuraAuthHeader();
            expect(authHeader).to.eq(`Basic ${auth}`);
        });

        it('should get infura node info', () => {
            const nodeInfo = makeInfuraNode();

            expect(nodeInfo.host).to.eq('ipfs.infura.io');
            expect(nodeInfo.port).to.eq(5001);
            expect(nodeInfo.protocol).to.eq('https');
            expect(nodeInfo.headers).to.have.property(
                'authorization',
                getInfuraAuthHeader(),
            );
        });
    });

    describe('makeDefaultLocalIpfs(), makeCustomIpfsNode()', () => {
        it('should get default settings for local node', () => {
            const nodeInfo = makeDefaultLocalIpfs();
            expect(nodeInfo.host).to.eq('127.0.0.1');
            expect(nodeInfo.port).to.eq(5001);
            expect(nodeInfo.protocol).to.eq('http');
            expect(nodeInfo.headers).to.be.empty;
        });

        it('should get settings for custom ipfs node', () => {
            process.env[EnvVar.IfpsHost] = 'zkp.eth.io';
            process.env[EnvVar.IpfsPort] = '5000';
            process.env[EnvVar.IpfsProtocol] = 'https';

            const nodeInfo = makeCustomIpfsNode();
            expect(nodeInfo.host).to.eq('zkp.eth.io');
            expect(nodeInfo.port).to.eq(5000);
            expect(nodeInfo.protocol).to.eq('https');
            expect(nodeInfo.headers).to.be.empty;
        });

        it('should throw error for invalid ipfs protocol', () => {
            process.env[EnvVar.IfpsHost] = 'zkp.eth.io';
            process.env[EnvVar.IpfsPort] = '5000';
            process.env[EnvVar.IpfsProtocol] = 'invalid_protocol';

            expect(() => makeCustomIpfsNode()).to.throw(
                '"invalid_protocol" is not a valid protocol. Must be http or https',
            );
        });

        it('should throw error for invalid ipfs port', () => {
            process.env[EnvVar.IfpsHost] = 'zkp.eth.io';
            process.env[EnvVar.IpfsPort] = 'invalid_port';
            process.env[EnvVar.IpfsProtocol] = 'https';

            expect(() => makeCustomIpfsNode()).to.throw(
                '"invalid_port" is not valid port. Must be a number',
            );
        });
    });

    describe('getIpfsNode()', () => {
        it('should get infura node info when infura flag is set to true', () => {
            const useInfura = true;
            const useCustom = false;
            const node = getIpfsNode(useInfura, useCustom);
            expect(node.host).to.eq('ipfs.infura.io');
            expect(node.port).to.eq(5001);
            expect(node.protocol).to.eq('https');
            expect(node.headers).to.be.not.empty;
        });

        it('should get custom node info when custom flag is set to true', () => {
            process.env[EnvVar.IfpsHost] = 'zkp.eth.io';
            process.env[EnvVar.IpfsPort] = '1000';
            process.env[EnvVar.IpfsProtocol] = 'https';

            const useInfura = false;
            const useCustom = true;
            const node = getIpfsNode(useInfura, useCustom);

            expect(node.host).to.eq('zkp.eth.io');
            expect(node.port).to.eq(1000);
            expect(node.protocol).to.eq('https');
            expect(node.headers).to.be.empty;
        });

        it('should get default node info when no flags are set', () => {
            const useInfura = false;
            const useCustom = false;
            const node = getIpfsNode(useInfura, useCustom);

            expect(node.host).to.eq('127.0.0.1');
            expect(node.port).to.eq(5001);
            expect(node.protocol).to.eq('http');
            expect(node.headers).to.be.empty;
        });
    });

    describe('getIndexHtml()', () => {
        it('should update all paths in build/index.html', () => {
            const inputHtmlPath = 'tests/data/original.index.html';
            const expectedHtmlPath = 'tests/data/expected.index.html';
            const ipfsCid = '__ipfs_cid';

            const expectedHtml = fs.readFileSync(expectedHtmlPath).toString();
            const outputHtml = getIndexHtml(inputHtmlPath, ipfsCid);

            expect(outputHtml).to.be.eq(expectedHtml);
        });
    });

    describe('makeCommmentBody()', () => {
        it('should generate comment body for gitlab', () => {
            const date = new Date();
            const ipfsCid = '__ipfs_cid';

            const body = makeCommentBody(ipfsCid, [
                {
                    commitShaShort: '0x1',
                    rootDirCid: '0xRoot',
                    indexHtmlCid: '0xIndex',
                    createdAt: date,
                },
            ]);

            const expectedBody = [
                '#### Your latest IPFS build can be accessed from [here](https://ipfs.io/ipfs/__ipfs_cid/) 🔥',
                '<details>',
                `<summary>Previous Builds</summary>`,
                `- 0x1 (${date.toUTCString()}) : [0xIndex](https://ipfs.io/ipfs/0xIndex/)`,
                '</details>\n\n',
                '[](____ipfs_deploy_comment)',
                `[  ]([["0x1","0xRoot","0xIndex",${date.getTime()}]])`,
            ].join('\n\n');

            expect(body).to.eq(expectedBody);
        });

        it('should add the unpin warnning for the comment body', () => {
            const date = new Date();
            const ipfsCid = '__ipfs_cid';

            const body = makeCommentBody(
                ipfsCid,
                [
                    {
                        commitShaShort: '0x1',
                        rootDirCid: '0xRoot',
                        indexHtmlCid: '0xIndex',
                        createdAt: date,
                    },
                ],
                true, // unpin flag
            );

            const expectedBody = [
                '#### Your latest IPFS build can be accessed from [here](https://ipfs.io/ipfs/__ipfs_cid/) 🔥',
                '<details>',
                `<summary>Previous Builds</summary>`,
                `- 0x1 (${date.toUTCString()}) : [0xIndex](https://ipfs.io/ipfs/0xIndex/)`,
                '</details>',
                `📛 Note that the links above are **unpinned** at *${date.toUTCString()}* **(may not be accessible anymore)** 📛`,
                '[](____ipfs_deploy_comment)',
                `[  ]([["0x1","0xRoot","0xIndex",${date.getTime()}]])`,
            ].join('\n\n');

            expect(body).to.eq(expectedBody);
        });
    });

    describe('serialize/deserialize', () => {
        it('should extract builds from comment body', () => {
            const testBuilds = [
                {
                    commitShaShort: '0xtestcommitsha',
                    indexHtmlCid:
                        'QmdqdGf4kBW4azaGAGqRXqXp38JiN21L1oZucNqsk8XBX8',
                    createdAt: new Date('2023-02-02T19:42:49.895Z'),
                    rootDirCid: null,
                },
                {
                    commitShaShort: '0xtestcommitsha',
                    rootDirCid:
                        'QmVhwPxxEt83CokxmcCxdTVujEHcCadJA5xoWeVpacNTnh',
                    indexHtmlCid:
                        'QmdqdGf4kBW4azaGAGqRXqXp38JiN21L1oZucNqsk8XBX8',
                    createdAt: new Date('2023-02-02T19:52:31.392Z'),
                },
                {
                    commitShaShort: '0xtest_commit',
                    rootDirCid:
                        'QmTQr9SKfQsxk2eW1TYjSZEyRBkY7DN5J6T6eaV4Fuprux',
                    indexHtmlCid:
                        'Qmdt64TApnsJZTWLNjEZeVyho6oLtpCSLkc3xH4vge1QRA',
                    createdAt: new Date('2023-02-07T07:40:11.305Z'),
                },
            ];
            const body = `[  ]([["0xtestcommitsha","QmdqdGf4kBW4azaGAGqRXqXp38JiN21L1oZucNqsk8XBX8",1675366969895],["0xtestcommitsha","QmVhwPxxEt83CokxmcCxdTVujEHcCadJA5xoWeVpacNTnh","QmdqdGf4kBW4azaGAGqRXqXp38JiN21L1oZucNqsk8XBX8",1675367551392],["0xtest_commit","QmTQr9SKfQsxk2eW1TYjSZEyRBkY7DN5J6T6eaV4Fuprux","Qmdt64TApnsJZTWLNjEZeVyho6oLtpCSLkc3xH4vge1QRA",1675755611305]])`;
            const builds = getPreviousBuilds(body);
            expect(builds).to.lengthOf(3);

            builds.forEach((build, idx) => {
                expect(build.commitShaShort).to.eq(
                    testBuilds[idx].commitShaShort,
                );
                expect(build.rootDirCid).to.eq(testBuilds[idx].rootDirCid);
                expect(build.indexHtmlCid).to.eq(testBuilds[idx].indexHtmlCid);
                expect(build.createdAt.toString()).to.eq(
                    testBuilds[idx].createdAt.toString(),
                );
            });
        });

        it('should return empty array for invalid comment body', () => {
            const builds = getPreviousBuilds(
                'invalid_comment_body_with_no_builds',
            );
            expect(builds).to.be.lengthOf(0);
        });

        describe('getWorkspace()', () => {
            it('should extract workspace from commit title', () => {
                const commitTitle = 'feat(dapp): add new feature';
                const workspace = getWorkspace(commitTitle);
                expect(workspace).to.be.eq('dapp');
            });

            it('should return null for in`valid commit title', () => {
                const commitTitle = 'feat[dapp]: add new feature';
                const workspace = getWorkspace(commitTitle);
                expect(workspace).to.be.null;
            });
        });

        describe('serializeBuilds()', () => {
            it('should serialize build objects into tuple of 4 elements encoded as JSON string', () => {
                const testBuild = {
                    commitShaShort: '0xtest_commit',
                    rootDirCid:
                        'QmTQr9SKfQsxk2eW1TYjSZEyRBkY7DN5J6T6eaV4Fuprux',
                    indexHtmlCid:
                        'Qmdt64TApnsJZTWLNjEZeVyho6oLtpCSLkc3xH4vge1QRA',
                    createdAt: new Date('2023-02-07T07:40:11.305Z'),
                };

                const builds = serializeBuilds([testBuild]);
                expect(builds).to.be.eq(
                    JSON.stringify([
                        [
                            testBuild.commitShaShort,
                            testBuild.rootDirCid,
                            testBuild.indexHtmlCid,
                            testBuild.createdAt.getTime(),
                        ],
                    ]),
                );
            });

            it("should serialize legacy builds that doesn't have `rootDirCid`", () => {
                const testBuild = {
                    commitShaShort: '0xtest_commit',
                    rootDirCid: null,
                    indexHtmlCid:
                        'Qmdt64TApnsJZTWLNjEZeVyho6oLtpCSLkc3xH4vge1QRA',
                    createdAt: new Date('2023-02-07T07:40:11.305Z'),
                };

                const builds = serializeBuilds([testBuild]);
                expect(builds).to.be.eq(
                    JSON.stringify([
                        [
                            testBuild.commitShaShort,
                            testBuild.indexHtmlCid,
                            testBuild.createdAt.getTime(),
                        ],
                    ]),
                );
            });
        });

        describe('deserializeBuilds()', () => {
            it('should convert json string into build objects', () => {
                const testBuild = {
                    commitShaShort: '0xtest_commit',
                    rootDirCid:
                        'QmTQr9SKfQsxk2eW1TYjSZEyRBkY7DN5J6T6eaV4Fuprux',
                    indexHtmlCid:
                        'Qmdt64TApnsJZTWLNjEZeVyho6oLtpCSLkc3xH4vge1QRA',
                    createdAt: new Date('2023-02-07T07:40:11.305Z'),
                };

                const buildsStr = serializeBuilds([testBuild]);
                const builds = deserializeBuilds(buildsStr);
                expect(builds).to.be.lengthOf(1);
                expect(builds[0].commitShaShort).to.eq(
                    testBuild.commitShaShort,
                );
                expect(builds[0].rootDirCid).to.eq(testBuild.rootDirCid);
                expect(builds[0].indexHtmlCid).to.eq(testBuild.indexHtmlCid);
                expect(builds[0].createdAt.toString()).to.eq(
                    testBuild.createdAt.toString(),
                );
            });

            it("should deserialize legacy builds that doesn't have `rootDirCid`", () => {
                const testBuild = {
                    commitShaShort: '0xtest_commit',
                    rootDirCid: null,
                    indexHtmlCid:
                        'Qmdt64TApnsJZTWLNjEZeVyho6oLtpCSLkc3xH4vge1QRA',
                    createdAt: new Date('2023-02-07T07:40:11.305Z'),
                };

                const buildsStr = serializeBuilds([testBuild]);
                const builds = deserializeBuilds(buildsStr);
                expect(builds).to.be.lengthOf(1);
                expect(builds[0].commitShaShort).to.eq(
                    testBuild.commitShaShort,
                );
                expect(builds[0].rootDirCid).to.eq(testBuild.rootDirCid);
                expect(builds[0].indexHtmlCid).to.eq(testBuild.indexHtmlCid);
                expect(builds[0].createdAt.toString()).to.eq(
                    testBuild.createdAt.toString(),
                );
            });
        });

        describe('getMergeReqIdOrFail()', () => {
            it('should get merge request id from process.env', () => {
                process.env[EnvVar.MergeReqId] = '882';
                const mergeReqId = getMergeReqIdOrFail('');
                expect(mergeReqId).to.be.eq('882');
            });

            it('should get merge request id from commit message', () => {
                process.env[EnvVar.MergeReqId] = undefined;
                const fullCommitMessage = `Merge branch 'ahmed/ipfs-prev-builds' into 'main'
                                           feat(dapp): keep previous builds on IPFS for every MR
                                           See merge request !882`;

                const mergeReqId = getMergeReqIdOrFail(fullCommitMessage);
                expect(mergeReqId).to.be.eq('882');
            });

            it('should throw error if id is not in `process.env` or in the commit message', () => {
                process.env[EnvVar.MergeReqId] = undefined;
                const msg = 'test commit message';
                expect(() => getMergeReqIdOrFail(msg)).to.throw(
                    'Invlaid Commit Message. Cannot extract merge request ID. Commit Message: test commit message',
                );
            });
        });
    });

    describe('Utils', () => {
        it('makeIpfsUrl()', () => {
            const test = makeIpfsUrl(
                'QmdqdGf4kBW4azaGAGqRXqXp38JiN21L1oZucNqsk8XBX8',
            );
            expect(test).to.eq(
                'https://ipfs.io/ipfs/QmdqdGf4kBW4azaGAGqRXqXp38JiN21L1oZucNqsk8XBX8/',
            );
        });

        it('getFlag()', () => {
            process.argv = ['--local', '--unpin', '--ci', '--custom'];
            expect(getFlag('--local')).to.be.true;
            expect(getFlag('--unpin')).to.be.true;
            expect(getFlag('--ci')).to.be.true;
            expect(getFlag('--custom')).to.be.true;
            expect(getFlag('--infura')).to.be.false;
        });

        describe('getEnvVarOrFail()', () => {
            it('should get environment variable if it exist', () => {
                const token = 'gitlab_access_token';
                process.env[EnvVar.GitLabAccessToken] = token;
                expect(getEnvVarOrFail(EnvVar.GitLabAccessToken)).to.be.eq(
                    token,
                );
            });

            it("should throw error if the requested environment variable doesn't exist", () => {
                process.env[EnvVar.IfpsHost] = undefined;
                expect(() => getEnvVarOrFail(EnvVar.IfpsHost)).to.throw(
                    "Missing 'IPFS_HOST' environment variable",
                );
            });
        });
    });

    it('Ensure environment variables names', () => {
        expect(EnvVar.GitLabAccessToken).to.be.eq('GITLAB_ACCESS_TOKEN');
        expect(EnvVar.ProjectId).to.be.eq('INFURA_PROJECT_ID');
        expect(EnvVar.ProjectSecret).to.be.eq('INFURA_PROJECT_SECRET_ID');
        expect(EnvVar.CommitShaShort).to.be.eq('CI_COMMIT_SHORT_SHA');
        expect(EnvVar.FullCommitMessage).to.be.eq('CI_COMMIT_MESSAGE');
        expect(EnvVar.MergeReqId).to.be.eq('CI_MERGE_REQUEST_IID');
        expect(EnvVar.IfpsHost).to.be.eq('IPFS_HOST');
        expect(EnvVar.IpfsPort).to.be.eq('IPFS_PORT');
        expect(EnvVar.IpfsProtocol).to.be.eq('IPFS_PROTOCOL');
    });
});
