import React, {useCallback} from 'react';

import {useWeb3React} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';

import {useOnConnect} from '../../hooks/web3';
import {useAppDispatch} from '../../redux/hooks';
import {connectWallet} from '../../redux/slices/isWalletConnected';
import {safeOpenMetamask} from '../Common/links';
import PrimaryActionButton from '../Common/PrimaryActionButton';

const ConnectButton = () => {
    const context = useWeb3React();
    const {error} = context;
    const isNoEthereumProviderError = error instanceof NoEthereumProviderError;

    const dispatch = useAppDispatch();
    const onConnect = useOnConnect();

    const onWalletConnect = useCallback(() => {
        onConnect();
        dispatch(connectWallet);
    }, [onConnect, dispatch]);

    return (
        <PrimaryActionButton
            onClick={
                isNoEthereumProviderError ? safeOpenMetamask : onWalletConnect
            }
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
