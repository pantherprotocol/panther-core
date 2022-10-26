import {UnsupportedChainIdError} from '@web3-react/core';
import {
    InjectedConnector,
    NoEthereumProviderError,
} from '@web3-react/injected-connector';

import {Web3ReactContextInterface} from '../types/web3';

import {CHAIN_IDS, FAUCET_CHAIN_IDS} from './env';

export interface Network {
    name: string;
    rpcURL: string;
    symbol: string;
    decimals: number;
    explorerURLs: Array<string>;
    logo: string;
}

// MASP chain ID could be only on Polygon or Hardhat networks
export type MaspChainIds = 137 | 80001 | 31337;

export const supportedNetworks: Record<number, Network> = {
    1: {
        name: 'Ethereum',
        rpcURL: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        symbol: 'ETH',
        decimals: 18,
        explorerURLs: ['https://etherscan.io/'],
        logo: 'ETH',
    },
    4: {
        name: 'Rinkeby',
        rpcURL: 'https://rinkey.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        symbol: 'ETH',
        decimals: 18,
        explorerURLs: ['https://rinkeby.etherscan.io/'],
        logo: 'ETH',
    },
    5: {
        name: 'Goerli',
        rpcURL: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        symbol: 'ETH',
        decimals: 18,
        explorerURLs: ['https://goerli.etherscan.io/'],
        logo: 'ETH',
    },
    137: {
        name: 'Polygon',
        rpcURL: 'https://polygon-rpc.com/',
        symbol: 'MATIC',
        decimals: 18,
        explorerURLs: ['https://polygonscan.com/'],
        logo: 'MATIC',
    },
    80001: {
        name: 'Mumbai',
        rpcURL: 'https://matic-mumbai.chainstacklabs.com',
        // This one doesn't work any more? See https://chainlist.org/
        // rpcURL: 'https://rpc-mumbai.maticvigil.com',
        symbol: 'MATIC',
        decimals: 18,
        explorerURLs: ['https://mumbai.polygonscan.com/'],
        logo: 'MATIC',
    },
    31337: {
        name: 'Hardhat',
        rpcURL: 'http://127.0.0.1:8545/',
        symbol: 'ETH',
        decimals: 18,
        explorerURLs: ['https://tryethernal.com/'],
        logo: 'ETH',
    },
};

export const hasWallet = (error: Error | undefined): boolean => {
    return !(error instanceof NoEthereumProviderError);
};

// chainId and error are passed from web3-react context.
export const onWrongNetwork = (
    context: Web3ReactContextInterface,
    chainIds: number[],
): boolean => {
    if (context.chainId && !chainIds.includes(context.chainId)) {
        return true;
    }
    return !!(
        context.error && context.error instanceof UnsupportedChainIdError
    );
};

export const isEthereumNetwork = (chainId: number): boolean => {
    return [1, 4, 5].includes(chainId);
};

export const isConnected = ({
    active,
    account,
    error,
}: Web3ReactContextInterface) => {
    return !!(active && account && !error);
};

export const injected = new InjectedConnector({
    supportedChainIds: CHAIN_IDS,
});

export const injectedFaucet = new InjectedConnector({
    supportedChainIds: FAUCET_CHAIN_IDS,
});

export function currentNetwork(chainId: number | undefined): Network | null {
    return chainId ? supportedNetworks[chainId] : null;
}

export const isWrongNetwork = (
    context: Web3ReactContextInterface,
    chainIds: number[],
): boolean => {
    const {active, error} = context;

    const wrongNetwork =
        onWrongNetwork(context, chainIds) ||
        error instanceof UnsupportedChainIdError;

    console.debug(
        'header: wrongNetwork',
        wrongNetwork,
        '/ active',
        active,
        '/ error',
        error,
    );
    return wrongNetwork;
};
