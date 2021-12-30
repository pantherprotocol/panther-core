import {UnsupportedChainIdError} from '@web3-react/core';
import {Web3ReactContextInterface} from './types';
import {
    InjectedConnector,
    NoEthereumProviderError,
} from '@web3-react/injected-connector';

import {utils} from 'ethers';

export const CHAIN_ID = Number(process.env.CHAIN_ID);
export const CHAIN_HEX_ID = utils.hexValue(CHAIN_ID);

const supportedChainIds = [CHAIN_ID];

interface Network {
    name: string;
    rpcURL: string;
    symbol: string;
    decimals: number;
    explorerURLs: Array<string>;
}

const supportedNetworks: Record<number, Network> = {
    137: {
        name: 'Matic (Polygon mainnet)',
        rpcURL: 'https://rpc-mainnet.maticvigil.com/',
        symbol: 'MATIC',
        decimals: 18,
        explorerURLs: ['https://polygonscan.com/'],
    },
    80001: {
        name: 'Mumbai (Polygon testnet)',
        rpcURL: 'https://rpc-mumbai.maticvigil.com/',
        symbol: 'TMATIC',
        decimals: 18,
        explorerURLs: ['https://polygonscan.com/'],
    },
    31337: {
        name: 'Hardhat Network',
        rpcURL: 'http://127.0.0.1:8545/',
        symbol: 'ETH',
        decimals: 18,
        explorerURLs: ['https://tryethernal.com/'],
    },
};

export const requiredChainId = Number(process.env.CHAIN_ID);
if (!requiredChainId) {
    throw `CHAIN_ID must be set to a supported network`;
}
export const requiredNetwork = supportedNetworks[requiredChainId];
if (!requiredNetwork) {
    throw `CHAIN_ID was set to ${requiredChainId} which is not a supported network`;
}
export const suggestedRpcURL =
    process.env.SUGGESTED_RPC_URL || requiredNetwork.rpcURL;
if (process.env.NODE_ENV !== 'test') {
    console.log('Required network details:\n', requiredNetwork);
}

export const hasWallet = (error: Error | undefined): boolean => {
    return !(error instanceof NoEthereumProviderError);
};

// chainId and error are passed from web3-react context.
export const onWrongNetwork = (context: Web3ReactContextInterface): boolean => {
    if (context.chainId && context.chainId !== requiredChainId) {
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
    supportedChainIds,
});