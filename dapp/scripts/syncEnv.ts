#!/usr/bin/env ts-node

// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

// Script to extract various values from smart contracts:
//
// - advanced staking start/end/unlock from Staking terms,
// - reward period times AdvancedStakeRewardController
// - early redemption time from PantherPoolV0's exitTime() or EXIT_TIME()
//
// and then accordingly check or update either:
//
// - the Amplify app's environment variables, or
// - the local .env values.
//
// Usage:
//
//   yarn amplify:check
//   yarn amplify:sync
//   yarn env:check
//   yarn env:sync

import child_process from 'child_process';
import fs from 'fs';

import {JsonRpcProvider} from '@ethersproject/providers';
// eslint-disable-next-line import/order
import * as dotenv from 'dotenv';

// This needs to come before imports which need the environment; see
// https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

import {ethers} from 'ethers';
import yargs from 'yargs/yargs';

import {info, success, warn, die} from '../src/lib/log';
import {bnStrToNumber} from '../src/lib/numbers';
import {
    getAdvancedStakeRewardControllerContract,
    getPoolContract,
    getRewardMasterContract,
    getStakingContract,
} from '../src/services/contracts';
import {env as servicesEnv} from '../src/services/env';
import {Staking} from '../src/types/contracts/Staking';

const APP_NAME = 'panther-core';
const CHAIN_ID = 80001;

type App = {
    name: string;
};

function exec(cmd: string): string {
    return child_process.execSync(cmd, {encoding: 'utf8'});
}

function getAppId(): string {
    const cmd = 'aws amplify list-apps';
    let stdout: string | undefined;
    try {
        stdout = exec(cmd);
    } catch (err: any) {
        die(
            `Failed to run: ${cmd}\n` +
                'Please check that you have correctly installed and configured the AWS CLI.',
        );
        return '';
    }
    const apps = JSON.parse(stdout).apps;
    const core = apps.find((app: App) => app.name == APP_NAME);
    console.log(`Amplify app_id: ${core.appId}`);
    console.log();
    return core.appId;
}

async function safeContractGetterCall(
    contract: ethers.Contract,
    getter: string,
): Promise<string | Error> {
    try {
        return await contract[getter]();
    } catch (err: any) {
        return err;
    }
}

async function getExitTime(provider: ethers.providers.JsonRpcProvider) {
    const pool = getPoolContract(provider, CHAIN_ID);

    let response = await safeContractGetterCall(pool, 'exitTime');
    if (response instanceof Error) {
        warn('Failed to call exitTime(); falling back to EXIT_TIME() ...');
        response = await safeContractGetterCall(pool, 'EXIT_TIME');
    }
    if (response instanceof Error) {
        console.error('Failed to call EXIT_TIME:');
        console.error(response);
        process.exit(1);
    }
    return bnStrToNumber(response);
}

type Terms = {
    allowedSince: number;
    allowedTill: number;
    lockedTill: number;
    apyStart: number;
    apyEnd: number;
};

async function getTerms(
    staking: Staking,
    provider: JsonRpcProvider,
): Promise<Terms> {
    const ADVANCED = ethers.utils.id('advanced').slice(0, 10);
    const terms = await staking.terms(ADVANCED);
    const {allowedSince, allowedTill, lockedTill} = terms;
    const [, , apyStart, apyEnd] = await getControllerTerms(provider, staking);
    return {allowedSince, allowedTill, lockedTill, apyStart, apyEnd};
}

function reportStakingTerms(terms: Terms) {
    const {allowedSince, allowedTill, lockedTill} = terms;
    info(
        `Advanced staking allowed from ${allowedSince} (${new Date(
            allowedSince * 1000,
        )})`,
    );
    info(
        `Advanced staking allowed till ${allowedTill} (${new Date(
            allowedTill * 1000,
        )})`,
    );
    info(
        `Advanced staking locked till ${lockedTill} (${new Date(
            lockedTill * 1000,
        )})`,
    );
}

async function getControllerTerms(
    provider: ethers.providers.JsonRpcProvider,
    staking: Staking,
): Promise<[number, number, number, number]> {
    const rewardMasterAddress = await staking.REWARD_MASTER();
    console.log(`Staking contract has REWARD_MASTER at ${rewardMasterAddress}`);

    const rewardMaster = getRewardMasterContract(
        provider,
        CHAIN_ID,
        rewardMasterAddress,
    );
    const controllerAddress = await rewardMaster.rewardAdvisers(
        staking.address,
        '0xcc995ce8',
    );
    console.log(
        `RewardMaster has advisor (AdvancedStakeRewardController) at ${controllerAddress}`,
    );
    const controller = getAdvancedStakeRewardControllerContract(CHAIN_ID);
    const params = await controller.rewardParams();
    const rewardingStart = params.startTime;
    const rewardingEnd = params.endTime;
    const startApy = params.startZkpApy;
    const endApy = params.endZkpApy;
    info(
        `rewardingStart is ${rewardingStart} (${new Date(
            rewardingStart * 1000,
        )})`,
    );
    info(`rewardingEnd is ${rewardingEnd} (${new Date(rewardingEnd * 1000)})`);
    return [rewardingStart, rewardingEnd, startApy, endApy];
}

type Environment = {[name: string]: string};

function getAppEnvVars(appId: string): Environment {
    const stdout = exec(`aws amplify get-app --app-id ${appId}`);
    const app = JSON.parse(stdout).app;
    return app.environmentVariables;
}

function getFileEnvVars(file = '.env'): Environment {
    const envContents = fs.readFileSync(file);
    return dotenv.parse(envContents);
}

function setAmplifyEnvVars(appId: string, env: Environment) {
    const envStr = JSON.stringify(env);
    // This will not interfere with per-branch overrides, which are stored
    // separately, and can be read/updated by get-branch / update-branch
    // respectively.
    const cmd = `aws amplify update-app --app-id ${appId} --environment-variables '${envStr}'`;
    console.log('\nRunning:');
    console.log(cmd);
    console.log();
    const stdout = exec(cmd);
    console.log(stdout);
}

function setFileEnvVars(file: string, changes: Change[]) {
    let contents = fs.readFileSync(file, {encoding: 'utf8'});

    let firstAppend = true;
    for (const [name, value] of changes) {
        const re = new RegExp(`^${name}=`, 'm');
        if (contents.match(re)) {
            const re2 = new RegExp(`^(${name}=).*$`, 'm');
            contents = contents.replace(re2, `$1${value}`);
        } else {
            if (firstAppend) {
                contents = contents.replace(
                    /\n*$/,
                    `\n\n# Automatically appended by ${__filename}\n` +
                        `${name}=${value}\n`,
                );
                firstAppend = false;
            } else {
                contents = contents.replace(/\n*$/, `\n${name}=${value}\n`);
            }
        }
    }
    fs.writeFileSync(file, contents);
    console.log('Wrote to', file);
}

async function checkControllerTimes(
    provider: ethers.providers.JsonRpcProvider,
    staking: Staking,
    terms: Terms,
): Promise<void> {
    const [rewardingStart, rewardingEnd] = await getControllerTerms(
        provider,
        staking,
    );
    console.log();

    const {allowedSince, lockedTill} = terms;
    if (rewardingStart == allowedSince) {
        success(
            `AdvancedStakeRewardController.REWARDING_START matched allowedSince`,
        );
    } else {
        warn(
            `AdvancedStakeRewardController.REWARDING_START was ${rewardingStart} (${new Date(
                rewardingStart * 1000,
            )})`,
        );
        warn(
            `                       but terms.allowedSince was ${allowedSince} (${new Date(
                allowedSince * 1000,
            )})`,
        );
    }

    if (rewardingEnd == lockedTill) {
        success(
            `AdvancedStakeRewardController.REWARDING_END matched lockedTill`,
        );
    } else {
        warn(
            `AdvancedStakeRewardController.REWARDING_END was ${rewardingEnd} (${new Date(
                rewardingEnd * 1000,
            )})`,
        );
        warn(
            `                             but lockedTill was ${lockedTill} (${new Date(
                lockedTill * 1000,
            )})`,
        );
    }
}

function checkEnvVar(
    env: Environment,
    name: string,
    value: string,
    update: boolean,
): [string, string] | undefined {
    if (env[name] == value) {
        success(`${name} already set to ${value}; no change needed.`);
        return;
    } else {
        const action = update ? 'Updating' : 'Would update';
        warn(`${action} ${name} from ${env[name]} to ${value}.`);
        if (update) {
            env[name] = value;
        }
        return [name, value];
    }
}

type Change = [name: string, value: string];

function checkEnvVarsAgainstAmplify(env: Environment): void {
    const vars = Object.keys(servicesEnv);
    const ALLOW_MISMATCH = [
        'FAUCET_BASE_URL',
        'CHAIN_IDS',
        'COMMITMENT_TREE_URL_80001',
    ];
    for (const name of vars) {
        if (ALLOW_MISMATCH.includes(name)) continue;

        const amplify = env[name];
        if (amplify === undefined) continue;

        const local = process.env[name];
        if (local === undefined) continue;

        if (local !== amplify) {
            if (local.toLowerCase() === amplify.toLowerCase()) {
                warn(
                    `${name} is "${local}" locally but different case in Amplify: "${amplify}"`,
                );
            } else {
                warn(
                    `${name} is "${local}" locally but "${amplify}" in Amplify`,
                );
            }
        }
    }
}

function checkEnvVarsForSync(
    env: Environment,
    terms: Terms,
    update: boolean,
): Change[] {
    const data = [
        ['ADVANCED_STAKING_T_START', String(terms.allowedSince)],
        ['ADVANCED_STAKING_T_END', String(terms.allowedTill)],
        ['ADVANCED_STAKING_APY_START', String(terms.apyStart)],
        ['ADVANCED_STAKING_APY_END', String(terms.apyEnd)],
    ];
    const changes: Change[] = [];
    for (const [name, value] of data) {
        const change = checkEnvVar(env, name, value, update);
        if (change) changes.push(change);
    }
    return changes;
}

function parseArgs() {
    return yargs(process.argv.slice(2))
        .usage('Usage: $0 [options]')
        .example(
            '$0 --set',
            'Update Amplify app environment variables to match the contracts',
        )
        .example(
            '$0 --file .env.example',
            'Check whether variables in .env.example matches the contracts',
        )
        .option('file', {
            alias: 'f',
            type: 'string',
            description: 'Check or update file instead of Amplify app',
            require: false,
        })
        .coerce('file', f => (f === '' ? '.env' : f))
        .option('write', {
            alias: 'w',
            type: 'boolean',
            description: 'Write values rather than just checking them',
            default: false,
            require: false,
        })
        .help('h')
        .alias('h', 'help').argv;
}

async function main() {
    const args = parseArgs();

    const provider = new ethers.providers.JsonRpcProvider(
        'https://matic-mumbai.chainstacklabs.com',
    );

    // console.log(await provider.getNetwork());
    const exitTime = await getExitTime(provider);
    info(`exitTime is ${exitTime} (${new Date(exitTime * 1000)})`);

    console.log();

    const staking = getStakingContract(provider, 80001);
    const terms = await getTerms(staking, provider);
    reportStakingTerms(terms);

    console.log();

    const useAmplify = !args.file;
    const appId = useAmplify && getAppId();
    const env = appId ? getAppEnvVars(appId) : getFileEnvVars(args.file);
    // console.log('env: ', env);
    if (useAmplify) {
        checkEnvVarsAgainstAmplify(env);
    }

    await checkControllerTimes(provider, staking, terms);

    console.log();

    const changes = checkEnvVarsForSync(env, terms, args.write);
    if (!args.write) {
        if (changes.length > 0) {
            const target = useAmplify ? 'amplify' : 'dotenv';
            console.log(`\nRun yarn ${target}:sync to apply the changes.`);
        }
        return;
    }
    if (changes.length == 0) {
        const target = args.file || 'Amplify app';
        console.log(`No changes needed; won't update ${target}`);
        return;
    }
    if (appId) {
        setAmplifyEnvVars(appId, env);
    }
    if (args.file) {
        setFileEnvVars(args.file, changes);
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
