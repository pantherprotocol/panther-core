// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

//////////////////////////////////////////////////////////////////////////////
// PLEASE NOTE!  Any variables added to this file *must* also be added to
// amplify.yml and dapp/.env.example.
//////////////////////////////////////////////////////////////////////////////

const REQUIRED_ENV_VARS: string[] = [
    'APP_MODE',
    'CHAIN_IDS',
    'MASP_CHAIN_ID',
    'STAKE_REWARD_CONTROLLER_2_CONTRACT_1',
    'ADVANCED_STAKING_T_START',
    'ADVANCED_STAKING_T_END',
    'ADVANCED_STAKING_APY_START',
    'ADVANCED_STAKING_APY_END',
    'FAUCET_CHAIN_IDS',
    'FAUCET_BASE_URL',
    'APY_PRP',
];

const REQUIRED_CHAIN_ENV_VAR_PREFIXES: string[] = [
    'STAKING_CONTRACT',
    'STAKING_TOKEN_CONTRACT',
    'BLOCK_EXPLORER',
];

// We need this ludicrous repetitive approach because due to a quirk of
// dotenv-webpack, process.env[envVar] doesn't actually work:
// https://github.com/mrsteele/dotenv-webpack/issues/70#issuecomment-392525509

interface EnvVariables {
    [key: string]: string | undefined;
}

export const env: EnvVariables = {
    APP_MODE: process.env.APP_MODE,
    FAUCET_BASE_URL: process.env.FAUCET_BASE_URL,
    CHAIN_IDS: process.env.CHAIN_IDS,
    MASP_CHAIN_ID: process.env.MASP_CHAIN_ID,
    FAUCET_CHAIN_IDS: process.env.FAUCET_CHAIN_IDS,
    TOKEN_SYMBOL: process.env.TOKEN_SYMBOL,
    BLOCKED_COUNTRIES: process.env.BLOCKED_COUNTRIES,
    APY_PRP: process.env.APY_PRP,

    STAKE_REWARD_CONTROLLER_2_CONTRACT_1:
        process.env.STAKE_REWARD_CONTROLLER_2_CONTRACT_1,
    STAKE_REWARD_CONTROLLER_2_CONTRACT_4:
        process.env.STAKE_REWARD_CONTROLLER_2_CONTRACT_4,
    STAKE_REWARD_CONTROLLER_2_CONTRACT_137:
        process.env.STAKE_REWARD_CONTROLLER_2_CONTRACT_137,
    STAKE_REWARD_CONTROLLER_2_CONTRACT_31337:
        process.env.STAKE_REWARD_CONTROLLER_2_CONTRACT_31337,

    STAKING_CONTRACT_1: process.env.STAKING_CONTRACT_1,
    STAKING_CONTRACT_4: process.env.STAKING_CONTRACT_4,
    STAKING_CONTRACT_5: process.env.STAKING_CONTRACT_5,
    STAKING_CONTRACT_137: process.env.STAKING_CONTRACT_137,
    STAKING_CONTRACT_31337: process.env.STAKING_CONTRACT_31337,
    STAKING_CONTRACT_80001: process.env.STAKING_CONTRACT_80001,

    STAKING_TOKEN_CONTRACT_1: process.env.STAKING_TOKEN_CONTRACT_1,
    STAKING_TOKEN_CONTRACT_4: process.env.STAKING_TOKEN_CONTRACT_4,
    STAKING_TOKEN_CONTRACT_5: process.env.STAKING_TOKEN_CONTRACT_5,
    STAKING_TOKEN_CONTRACT_137: process.env.STAKING_TOKEN_CONTRACT_137,
    STAKING_TOKEN_CONTRACT_31337: process.env.STAKING_TOKEN_CONTRACT_31337,
    STAKING_TOKEN_CONTRACT_80001: process.env.STAKING_TOKEN_CONTRACT_80001,

    REWARD_MASTER_CONTRACT_1: process.env.REWARD_MASTER_CONTRACT_1,
    REWARD_MASTER_CONTRACT_4: process.env.REWARD_MASTER_CONTRACT_4,
    REWARD_MASTER_CONTRACT_5: process.env.REWARD_MASTER_CONTRACT_5,
    REWARD_MASTER_CONTRACT_137: process.env.REWARD_MASTER_CONTRACT_137,
    REWARD_MASTER_CONTRACT_31337: process.env.REWARD_MASTER_CONTRACT_31337,
    REWARD_MASTER_CONTRACT_80001: process.env.REWARD_MASTER_CONTRACT_80001,

    STAKES_REPORTER_CONTRACT_1: process.env.STAKES_REPORTER_CONTRACT_1,
    STAKES_REPORTER_CONTRACT_4: process.env.STAKES_REPORTER_CONTRACT_4,
    STAKES_REPORTER_CONTRACT_5: process.env.STAKES_REPORTER_CONTRACT_5,
    STAKES_REPORTER_CONTRACT_137: process.env.STAKES_REPORTER_CONTRACT_137,
    STAKES_REPORTER_CONTRACT_31337: process.env.STAKES_REPORTER_CONTRACT_31337,
    STAKES_REPORTER_CONTRACT_80001: process.env.STAKES_REPORTER_CONTRACT_80001,

    HAS_ADVANCED_STAKING_1: process.env.HAS_ADVANCED_STAKING_1,
    HAS_ADVANCED_STAKING_4: process.env.HAS_ADVANCED_STAKING_4,
    HAS_ADVANCED_STAKING_5: process.env.HAS_ADVANCED_STAKING_5,
    HAS_ADVANCED_STAKING_137: process.env.HAS_ADVANCED_STAKING_137,
    HAS_ADVANCED_STAKING_31337: process.env.HAS_ADVANCED_STAKING_31337,
    HAS_ADVANCED_STAKING_80001: process.env.HAS_ADVANCED_STAKING_80001,

    SUGGESTED_RPC_URL_1: process.env.SUGGESTED_RPC_URL_1,
    SUGGESTED_RPC_URL_4: process.env.SUGGESTED_RPC_URL_4,
    SUGGESTED_RPC_URL_5: process.env.SUGGESTED_RPC_URL_5,
    SUGGESTED_RPC_URL_137: process.env.SUGGESTED_RPC_URL_137,
    SUGGESTED_RPC_URL_31337: process.env.SUGGESTED_RPC_URL_31337,
    SUGGESTED_RPC_URL_80001: process.env.SUGGESTED_RPC_URL_80001,

    BLOCK_EXPLORER_1: process.env.BLOCK_EXPLORER_1,
    BLOCK_EXPLORER_4: process.env.BLOCK_EXPLORER_4,
    BLOCK_EXPLORER_5: process.env.BLOCK_EXPLORER_5,
    BLOCK_EXPLORER_137: process.env.BLOCK_EXPLORER_137,
    BLOCK_EXPLORER_31337: process.env.BLOCK_EXPLORER_31337,
    BLOCK_EXPLORER_80001: process.env.BLOCK_EXPLORER_80001,

    ADVANCED_STAKING_T_START: process.env.ADVANCED_STAKING_T_START,
    ADVANCED_STAKING_T_END: process.env.ADVANCED_STAKING_T_END,
    ADVANCED_STAKING_APY_START: process.env.ADVANCED_STAKING_APY_START,
    ADVANCED_STAKING_APY_END: process.env.ADVANCED_STAKING_APY_END,

    ADVANCED_STAKE_REWARD_CONTROLLER_CONTRACT_80001:
        process.env.ADVANCED_STAKE_REWARD_CONTROLLER_CONTRACT_80001,
    ADVANCED_STAKE_REWARD_CONTROLLER_CONTRACT_137:
        process.env.ADVANCED_STAKE_REWARD_CONTROLLER_CONTRACT_137,

    FAUCET_CONTRACT_80001: process.env.FAUCET_CONTRACT_80001,
    FAUCET_CONTRACT_31337: process.env.FAUCET_CONTRACT_31337,
    FAUCET_CONTRACT_137: process.env.FAUCET_CONTRACT_137,
    FAUCET_CONTRACT_5: process.env.FAUCET_CONTRACT_5,

    SUBGRAPH_IDS_80001: process.env.SUBGRAPH_IDS_80001,
    SUBGRAPH_IDS_31337: process.env.SUBGRAPH_IDS_31337,
    SUBGRAPH_IDS_137: process.env.SUBGRAPH_IDS_137,

    POOL_V0_CONTRACT_80001: process.env.POOL_V0_CONTRACT_80001,
    POOL_V0_CONTRACT_31337: process.env.POOL_V0_CONTRACT_31337,
    POOL_V0_CONTRACT_137: process.env.POOL_V0_CONTRACT_137,

    Z_ASSETS_REGISTRY_CONTRACT_80001:
        process.env.Z_ASSETS_REGISTRY_CONTRACT_80001,
    Z_ASSETS_REGISTRY_CONTRACT_31337:
        process.env.Z_ASSETS_REGISTRY_CONTRACT_31337,
    Z_ASSETS_REGISTRY_CONTRACT_137: process.env.Z_ASSETS_REGISTRY_CONTRACT_137,
};

export const BLOCKED_COUNTRIES = env.BLOCKED_COUNTRIES
    ? env.BLOCKED_COUNTRIES.split(',')
    : [];

export const CHAIN_IDS = env.CHAIN_IDS
    ? env.CHAIN_IDS.split(',').map(item => Number(item))
    : [];

if (!CHAIN_IDS.length) {
    throw `Failed to parse CHAIN_IDS value of '${env.CHAIN_IDS}' as a list of
    supported networks; got: '${CHAIN_IDS}'`;
}

export const MASP_CHAIN_ID: number | undefined = env.MASP_CHAIN_ID
    ? Number(env.MASP_CHAIN_ID)
    : undefined;

export const FAUCET_CHAIN_IDS = env.FAUCET_CHAIN_IDS
    ? env.FAUCET_CHAIN_IDS.split(',').map(item => Number(item))
    : [];

export function chainVar(varName: string, chainId: number): string | undefined {
    return env[`${varName}_${chainId}`];
}

function getRequiredChainEnvVars(chainId: number): string[] {
    return REQUIRED_CHAIN_ENV_VAR_PREFIXES.map(
        (varName: string) => `${varName}_${chainId}`,
    );
}

function getRequiredEnvVars(): string[] {
    const requiredChainEnvVars: string[][] = CHAIN_IDS.map((chainId: number) =>
        getRequiredChainEnvVars(chainId),
    );
    return REQUIRED_ENV_VARS.concat(...requiredChainEnvVars);
}

export function getMissingEnvVars(): string[] {
    return getRequiredEnvVars()
        .filter(varName => !env[varName])
        .sort();
}
