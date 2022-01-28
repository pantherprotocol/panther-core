import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';
import 'hardhat-contract-sizer';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

import './tasks/terms-add';
import './tasks/reward-adviser-add';
import './tasks/reward-pool-init';
import './tasks/time-increase';
import './tasks/proposal-gen';

import {HardhatUserConfig} from 'hardhat/config';
import {config as dotenvConfig} from 'dotenv';
import {resolve} from 'path';

dotenvConfig({path: resolve(__dirname, './.env')});

const config: HardhatUserConfig = {
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            forking: {
                url: `https://eth-mainnet.alchemyapi.io/v2/${getAlchemyKey()}`,
                blockNumber: 11589707,
                enabled: !!process.env.HARDHAT_FORKING_ENABLED,
            },
        },
        pchain: {url: 'http://127.0.0.1:8545'},

        mainnet: {
            url: `https://eth-mainnet.alchemyapi.io/v2/${getAlchemyKey()}`,
            accounts: getAccounts(process.env.MAINNET_PRIVKEY),
        },
        matic: {
            chainId: 137,
            url: `https://polygon-mainnet.g.alchemy.com/v2/${getAlchemyKey()}`,
            accounts: getAccounts(process.env.MAINNET_PRIVKEY),
        },
        mumbai: {
            chainId: 80001,
            url: `https://polygon-mumbai.g.alchemy.com/v2/${getAlchemyKey()}`,
            accounts: getAccounts(process.env.MUMBAI_PRIVKEY),
        },
        rinkeby: {
            url: `https://eth-rinkeby.alchemyapi.io/v2/${getAlchemyKey()}`,
            chainId: 4,
            accounts: getAccounts(process.env.RINKEBY_PRIVKEY),
        },
        polygon: {
            chainId: 137,
            url: `https://polygon-mainnet.g.alchemy.com/v2/${getAlchemyKey()}`,
            accounts: getAccounts(process.env.MAINNET_PRIVKEY),
        },
    },
    // @ts-ignore
    namedAccounts: {
        deployer: 0,
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

function getAccounts(privKey: string | undefined = process.env.PRIVATE_KEY) {
    if (process.env.FAKE_MNEMONIC)
        return {
            count: 5,
            initialIndex: 0,
            // fake mnemonic
            mnemonic: 'any pig at zoo eat toy now ten men see job run',
            path: "m/44'/60'/0'/0",
        };

    return [privKey || ''];
}

function getAlchemyKey() {
    if (!process.env.ALCHEMY_KEY && !process.env.FAKE_MNEMONIC)
        throw new Error('Please set your ALCHEMY_KEY');
    return process.env.ALCHEMY_KEY || '';
}

export default config;
