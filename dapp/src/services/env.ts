const REQUIRED_ENV_VARS: string[] = ['CHAIN_IDS'];

const REQUIRED_CHAIN_ENV_VAR_PREFIXES: string[] = [
    'STAKING_CONTRACT',
    'REWARD_MASTER_CONTRACT',
    'STAKING_TOKEN_CONTRACT',
    'BLOCK_EXPLORER',
    'REWARD_POOL_SIZE',
    'STAKING_PROGRAM_DURATION',
];

// We need this ludicrous repetitive approach because due to a quirk of
// dotenv-webpack, process.env[envVar] doesn't actually work:
// https://github.com/mrsteele/dotenv-webpack/issues/70#issuecomment-392525509

export const env = {
    CHAIN_IDS: process.env.CHAIN_IDS,
    TOKEN_SYMBOL: process.env.TOKEN_SYMBOL,

    REWARD_MASTER_CONTRACT_1: process.env.REWARD_MASTER_CONTRACT_1,
    REWARD_MASTER_CONTRACT_4: process.env.REWARD_MASTER_CONTRACT_4,
    REWARD_MASTER_CONTRACT_137: process.env.REWARD_MASTER_CONTRACT_137,
    REWARD_MASTER_CONTRACT_31337: process.env.REWARD_MASTER_CONTRACT_31337,
    REWARD_MASTER_CONTRACT_80001: process.env.REWARD_MASTER_CONTRACT_80001,

    STAKING_CONTRACT_1: process.env.STAKING_CONTRACT_1,
    STAKING_CONTRACT_4: process.env.STAKING_CONTRACT_4,
    STAKING_CONTRACT_137: process.env.STAKING_CONTRACT_137,
    STAKING_CONTRACT_31337: process.env.STAKING_CONTRACT_31337,
    STAKING_CONTRACT_80001: process.env.STAKING_CONTRACT_80001,

    STAKING_TOKEN_CONTRACT_1: process.env.STAKING_TOKEN_CONTRACT_1,
    STAKING_TOKEN_CONTRACT_4: process.env.STAKING_TOKEN_CONTRACT_4,
    STAKING_TOKEN_CONTRACT_137: process.env.STAKING_TOKEN_CONTRACT_137,
    STAKING_TOKEN_CONTRACT_31337: process.env.STAKING_TOKEN_CONTRACT_31337,
    STAKING_TOKEN_CONTRACT_80001: process.env.STAKING_TOKEN_CONTRACT_80001,

    VESTING_POOLS_CONTRACT_1: process.env.VESTING_POOLS_CONTRACT_1,
    VESTING_POOLS_CONTRACT_4: process.env.VESTING_POOLS_CONTRACT_4,
    VESTING_POOLS_CONTRACT_137: process.env.VESTING_POOLS_CONTRACT_137,
    VESTING_POOLS_CONTRACT_31337: process.env.VESTING_POOLS_CONTRACT_31337,
    VESTING_POOLS_CONTRACT_80001: process.env.VESTING_POOLS_CONTRACT_80001,

    SUGGESTED_RPC_URL_1: process.env.SUGGESTED_RPC_URL_1,
    SUGGESTED_RPC_URL_4: process.env.SUGGESTED_RPC_URL_4,
    SUGGESTED_RPC_URL_137: process.env.SUGGESTED_RPC_URL_137,
    SUGGESTED_RPC_URL_31337: process.env.SUGGESTED_RPC_URL_31337,
    SUGGESTED_RPC_URL_80001: process.env.SUGGESTED_RPC_URL_80001,

    BLOCK_EXPLORER_1: process.env.BLOCK_EXPLORER_1,
    BLOCK_EXPLORER_4: process.env.BLOCK_EXPLORER_4,
    BLOCK_EXPLORER_137: process.env.BLOCK_EXPLORER_137,
    BLOCK_EXPLORER_31337: process.env.BLOCK_EXPLORER_31337,
    BLOCK_EXPLORER_80001: process.env.BLOCK_EXPLORER_80001,

    REWARD_POOL_SIZE_1: process.env.REWARD_POOL_SIZE_1,
    REWARD_POOL_SIZE_4: process.env.REWARD_POOL_SIZE_4,
    REWARD_POOL_SIZE_137: process.env.REWARD_POOL_SIZE_137,
    REWARD_POOL_SIZE_31337: process.env.REWARD_POOL_SIZE_31337,
    REWARD_POOL_SIZE_80001: process.env.REWARD_POOL_SIZE_80001,

    STAKING_PROGRAM_DURATION_1: process.env.STAKING_PROGRAM_DURATION_1,
    STAKING_PROGRAM_DURATION_4: process.env.STAKING_PROGRAM_DURATION_4,
    STAKING_PROGRAM_DURATION_137: process.env.STAKING_PROGRAM_DURATION_137,
    STAKING_PROGRAM_DURATION_31337: process.env.STAKING_PROGRAM_DURATION_31337,
    STAKING_PROGRAM_DURATION_80001: process.env.STAKING_PROGRAM_DURATION_80001,
};

export const CHAIN_IDS = env.CHAIN_IDS
    ? env.CHAIN_IDS.split(',').map(item => Number(item))
    : [];

if (!CHAIN_IDS.length) {
    throw `Failed to parse CHAIN_IDS value of '${env.CHAIN_IDS}' as a list of
    supported networks; got: '${CHAIN_IDS}'`;
}

export function chainVar(varName: string, chainId: number): string {
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