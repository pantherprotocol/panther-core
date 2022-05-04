import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';
import 'hardhat-contract-sizer';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

import './tasks/terms-add';
import './tasks/terms-add-advanced-local';
import './tasks/reward-adviser-add';
import './tasks/reward-pool-init';
import './tasks/matic-reward-pool-init';
import './tasks/time-increase';
import './tasks/proposal-gen';
import './tasks/vesting-list';
import './tasks/staking-list';
import './tasks/unstaked-rewards';

import {HardhatUserConfig} from 'hardhat/config';
import {NetworkUserConfig, HttpNetworkAccountsUserConfig} from 'hardhat/types';
import {config as dotenvConfig} from 'dotenv';
import {resolve} from 'path';

dotenvConfig({path: resolve(__dirname, './.env')});

type NetworkName = string;

const CHAIN_IDS: {[name: string]: number} = {
    bsc: 56,
    bsctest: 97,
    ganache: 1337,
    goerli: 5,
    hardhat: 31337,
    kovan: 42,
    mainnet: 1,
    mumbai: 80001,
    polygon: 137,
    rinkeby: 4,
    ropsten: 3,
};

const ALCHEMY_ENDPOINTS: {[name: string]: string} = {
    mainnet: 'https://eth-mainnet.alchemyapi.io/v2/',
    rinkeby: 'https://eth-rinkeby.alchemyapi.io/v2/',
    goerli: 'https://eth-goerli.alchemyapi.io/v2/',
    kovan: 'https://eth-kovan.alchemyapi.io/v2/',
    ropsten: 'https://eth-ropsten.alchemyapi.io/v2/',

    polygon: 'https://polygon-mainnet.g.alchemy.com/v2/',
    mumbai: 'https://polygon-mumbai.g.alchemy.com/v2/',
};

const INFURA_ENDPOINTS: {[name: string]: string} = {
    mainnet: 'https://mainnet.infura.io/v3/',
    rinkeby: 'https://rinkeby.infura.io/v3/',
    goerli: 'https://goerli.infura.io/v3/',
    kovan: 'https://kovan.infura.io/v3/',
    ropsten: 'https://ropsten.infura.io/v3/',

    polygon: 'https://polygon-mainnet.infura.io/v3/',
    mumbai: 'https://polygon-mumbai.infura.io/v3/',
};

const forkingConfig = {
    url: process.env.HARDHAT_FORKING_URL || 'ts compiler hack',
    blockNumber: Number(process.env.HARDHAT_FORKING_BLOCK),
    enabled: !!process.env.HARDHAT_FORKING_ENABLED,
};

const config: HardhatUserConfig = {
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            forking: process.env.HARDHAT_FORKING_URL
                ? forkingConfig
                : undefined,
        },
        pchain: {url: 'http://127.0.0.1:8545'},

        mainnet: createNetworkConfig('mainnet'),
        goerli: createNetworkConfig('goerli'),
        kovan: createNetworkConfig('kovan'),
        rinkeby: createNetworkConfig('rinkeby'),
        ropsten: createNetworkConfig('ropsten'),

        polygon: createNetworkConfig('polygon'),
        mumbai: createNetworkConfig('mumbai'),
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY || process.env.POLYSCAN_API,
    },
    // @ts-ignore
    gasReporter: {
        currency: 'USD',
        ...(process.env.CMC_API_KEY
            ? {coinmarketcap: process.env.CMC_API_KEY}
            : {}),

        enabled: !!process.env.REPORT_GAS,
        excludeContracts: [],
        src: './contracts',
    },
    mocha: {
        timeout: 2000000000,
    },
    // @ts-ignore
    namedAccounts: {
        deployer: 0,
    },
    paths: {
        artifacts: './artifacts',
        cache: './cache',
        sources: './contracts',
        tests: './test',
    },
    solidity: {
        compilers: [
            {
                version: '0.8.4',
                settings: {
                    metadata: {
                        // Not including the metadata hash
                        // https://github.com/paulrberg/solidity-template/issues/31
                        bytecodeHash: 'none',
                    },
                    // You should disable the optimizer when debugging
                    // https://hardhat.org/hardhat-network/#solidity-optimizer-support
                    optimizer: {
                        enabled: true,
                        runs: 800,
                    },
                    outputSelection: {
                        '*': {
                            '*': ['storageLayout'],
                        },
                    },
                },
            },
        ],
    },
    typechain: {
        outDir: 'types/contracts',
        target: 'ethers-v5',
    },
};

function getAccounts(network: string): HttpNetworkAccountsUserConfig {
    if (process.env.PRIVATE_KEY) {
        return [process.env.PRIVATE_KEY];
    }
    return {
        count: 5,
        initialIndex: 0,
        mnemonic: getMnemonic(network),
        path: "m/44'/60'/0'/0",
    };
}

function createNetworkConfig(
    network: string,
    extraOpts = {},
): NetworkUserConfig {
    return Object.assign(
        {
            accounts: getAccounts(network),
            // @ts-ignore
            chainId: CHAIN_IDS[network],
            timeout: 99999,
            url: getRpcUrl(network),
        },
        extraOpts,
    );
}

function getRpcUrl(network: NetworkName): string {
    if (!!process.env.HTTP_PROVIDER) return process.env.HTTP_PROVIDER;
    if (process.env.INFURA_API_KEY && INFURA_ENDPOINTS[network])
        return INFURA_ENDPOINTS[network] + process.env.INFURA_API_KEY;
    if (process.env.ALCHEMY_API_KEY && ALCHEMY_ENDPOINTS[network])
        return ALCHEMY_ENDPOINTS[network] + process.env.ALCHEMY_API_KEY;
    if (network === 'bsc') return 'https://bsc-dataseed1.defibit.io/';
    if (network === 'bsctest')
        return 'https://data-seed-prebsc-1-s1.binance.org:8545';
    if (network === 'mumbai') return 'https://rpc-mumbai.maticvigil.com/';
    if (network === 'polygon') return 'https://polygon-rpc.com/';
    return 'undefined RPC provider URL';
}

function getMnemonic(network: NetworkName): string {
    if (process.env.HARDHAT_NO_MNEMONIC) {
        // dummy mnemonic
        return 'any pig at zoo eat toy now ten men see job run';
    }
    if (process.env.MNEMONIC) return process.env.MNEMONIC;
    try {
        return require('./mnemonic.js');
    } catch (error) {
        throw new Error(`Please set your MNEMONIC (for network: ${network})`);
    }
}

export default config;
