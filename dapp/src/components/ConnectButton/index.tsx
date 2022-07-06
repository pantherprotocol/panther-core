import React from 'react';

import {useWeb3React} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';

import {useOnConnect} from '../../hooks/web3';
import {safeOpenMetamask} from '../Common/links';
import PrimaryActionButton from '../Common/PrimaryActionButton';

const ConnectButton = () => {
    const context = useWeb3React();
    const {error} = context;
    const isNoEthereumProviderError = error instanceof NoEthereumProviderError;

    const onConnect = useOnConnect();

    return (
        <PrimaryActionButton
            onClick={isNoEthereumProviderError ? safeOpenMetamask : onConnect}
        >
            <span>
                {isNoEthereumProviderError
                    ? 'Install MetaMask'
                    : 'Connect Wallet'}
            </span>
        </PrimaryActionButton>
    );
};
export default ConnectButton;
