#!/usr/bin/env ts-node

// Script to extract advanced staking times from Staking terms
// and early redemption time from PantherPoolV0's exitTime()
// or exitTime()
// and then set the Amplify app's environment variables accordingly.
//
// Usage:
//
//   yarn amplify:check
//   yarn amplify:sync
//   yarn env:check
//   yarn env:sync

import child_process from 'child_process';
import fs from 'fs';

import dotenv from 'dotenv';
import {ethers} from 'ethers';
import yargs from 'yargs/yargs';

const APP_NAME = 'panther-core';

const STAKING = JSON.parse(
    fs.readFileSync(
        `${__dirname}/../../contracts/artifacts/contracts/Staking.sol/Staking.json`,
        {encoding: 'utf8'},
    ),
);
const STAKING_ABI = STAKING.abi;
const STAKING_INTERFACE = new ethers.utils.Interface(STAKING_ABI);

type App = {
    name: string;
};

function exec(cmd: string): string {
    return child_process.execSync(cmd, {encoding: 'utf8'});
}

function getAppId(): string {
    const stdout = exec('aws amplify list-apps');
    const apps = JSON.parse(stdout).apps;
    const core = apps.find((app: App) => app.name == APP_NAME);
    console.log(`Amplify app_id: ${core.appId}`);
    return core.appId;
}

function getEnvVar(name: string): string {
    const stdout = exec(`source ${__dirname}/../.env && echo $${name}`);
    return stdout.replace(/\n$/, '');
}

function getExitTimeCallData(fnName: string): string {
    const iface = new ethers.utils.Interface([
        `function ${fnName}() view returns (uint256)`,
    ]);
    return iface.encodeFunctionData(fnName);
}

async function safeContractCall(
    provider: ethers.providers.JsonRpcProvider,
    addr: string,
    data: string,
): Promise<string | Error> {
    try {
        return await provider.call({
            to: addr,
            data,
        });
    } catch (err: any) {
        return err;
    }
}

async function getExitTime(provider: ethers.providers.JsonRpcProvider) {
    const poolAddress = getEnvVar('POOL_V0_CONTRACT_80001');
    console.log(`Reading PantherPoolV0 contract at ${poolAddress}`);

    let data = getExitTimeCallData('exitTime');
    let response = await safeContractCall(provider, poolAddress, data);
    if (response instanceof Error) {
        console.log(
            'Failed to call exitTime(); falling back to EXIT_TIME() ...',
        );
        data = getExitTimeCallData('EXIT_TIME');
        response = await safeContractCall(provider, poolAddress, data);
    }
    if (response instanceof Error) {
        console.error('Failed to get exit time:');
        console.error(response);
        process.exit(1);
    }
    return Number(ethers.BigNumber.from(response).toString());
}

function getStakingTermsCallData(): string {
    const ADVANCED = ethers.utils.id('advanced').slice(0, 10);
    return STAKING_INTERFACE.encodeFunctionData('terms', [ADVANCED]);
}

type Terms = {
    allowedSince: number;
    allowedTill: number;
    lockedTill: number;
};

async function getStakingTerms(
    provider: ethers.providers.JsonRpcProvider,
): Promise<Terms> {
    const stakingAddress = getEnvVar('STAKING_CONTRACT_80001');
    console.log(`Reading Staking contract at ${stakingAddress}`);

    const data = getStakingTermsCallData();
    const response = await provider.call({
        to: stakingAddress,
        data,
    });
    const terms = STAKING_INTERFACE.decodeFunctionResult('terms', response);
    const {allowedSince, allowedTill, lockedTill} = terms;
    return {allowedSince, allowedTill, lockedTill};
}

function reportStakingTerms(terms: Terms) {
    const {allowedSince, allowedTill, lockedTill} = terms;
    console.log(
        `Advanced staking allowed from ${allowedSince} (${new Date(
            allowedSince * 1000,
        )})`,
    );
    console.log(
        `Advanced staking allowed till ${allowedTill} (${new Date(
            allowedTill * 1000,
        )})`,
    );
    console.log(
        `Advanced staking locked till ${lockedTill} (${new Date(
            lockedTill * 1000,
        )})`,
    );
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

function checkEnvVar(
    env: Environment,
    name: string,
    value: string,
    update: boolean,
): [string, string] | undefined {
    if (env[name] == value) {
        console.log(`${name} already set to ${value}; no change needed.`);
        return;
    } else {
        const action = update ? 'Updating' : 'Would update';
        console.log(`${action} ${name} from ${env[name]} to ${value}.`);
        if (update) {
            env[name] = value;
        }
        return [name, value];
    }
}

type Change = [name: string, value: string];

function checkEnvVars(
    env: Environment,
    exitTime: number,
    terms: Terms,
    update: boolean,
): Change[] {
    const data = [
        ['ADVANCED_STAKING_EARLY_REDEMPTION', String(exitTime)],
        ['ADVANCED_STAKING_T_START', String(terms.allowedSince)],
        ['ADVANCED_STAKING_T_END', String(terms.allowedTill)],
        ['ADVANCED_STAKING_T_UNLOCK', String(terms.lockedTill)],
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
    console.log(`exitTime is ${exitTime} (${new Date(exitTime * 1000)})`);

    console.log();

    const terms = await getStakingTerms(provider);
    reportStakingTerms(terms);

    console.log();

    const useAmplify = !args.file;
    const appId = useAmplify && getAppId();
    const env = appId ? getAppEnvVars(appId) : getFileEnvVars(args.file);
    // console.log('env: ', env);

    const changes = checkEnvVars(env, exitTime, terms, args.write);
    if (!args.write) {
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
