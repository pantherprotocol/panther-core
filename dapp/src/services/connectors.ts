import {UnsupportedChainIdError} from '@web3-react/core';
import {
    InjectedConnector,
    NoEthereumProviderError,
} from '@web3-react/injected-connector';

import ethIcon from '../images/eth-logo.svg';
import polygonIcon from '../images/polygon-logo.svg';

import {CHAIN_IDS} from './env';
import {Web3ReactContextInterface} from './types';

export interface Network {
    name: string;
    rpcURL: string;
    symbol: string;
    decimals: number;
    explorerURLs: Array<string>;
    logo: string;
}

export const supportedNetworks: Record<number, Network> = {
    1: {
        name: 'Ethereum',
        rpcURL: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        symbol: 'ETH',
        decimals: 18,
        explorerURLs: ['https://etherscan.io/'],
        logo: ethIcon,
    },
    4: {
        name: 'Rinkeby',
        rpcURL: 'https://rinkey.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        symbol: 'ETH',
        decimals: 18,
        explorerURLs: ['https://rinkeby.etherscan.io/'],
        logo: ethIcon,
    },
    137: {
        name: 'Polygon',
        rpcURL: 'https://polygon-rpc.com/',
        symbol: 'MATIC',
        decimals: 18,
        explorerURLs: ['https://polygonscan.com/'],
        logo: polygonIcon,
    },
    80001: {
        name: 'Mumbai',
        rpcURL: 'https://matic-mumbai.chainstacklabs.com',
        // This one doesn't work any more? See https://chainlist.org/
        // rpcURL: 'https://rpc-mumbai.maticvigil.com',
        symbol: 'MATIC',
        decimals: 18,
        explorerURLs: ['https://mumbai.polygonscan.com/'],
        logo: polygonIcon,
    },
    31337: {
        name: 'Hardhat',
        rpcURL: 'http://127.0.0.1:8545/',
        symbol: 'ETH',
        decimals: 18,
        explorerURLs: ['https://tryethernal.com/'],
        logo: ethIcon,
    },
};

export const hasWallet = (error: Error | undefined): boolean => {
    return !(error instanceof NoEthereumProviderError);
};

// chainId and error are passed from web3-react context.
export const onWrongNetwork = (context: Web3ReactContextInterface): boolean => {
    if (context.chainId && !CHAIN_IDS.includes(context.chainId)) {
        return true;
    }
    return !!(
        context.error && context.error instanceof UnsupportedChainIdError
    );
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
