import React, {useCallback} from 'react';

import {useWeb3React} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';

import {useOnConnect} from '../../hooks/web3';
import {useAppDispatch} from '../../redux/hooks';
import {setConnected} from '../../redux/slices/ui/isWalletConnected';
import {safeOpenMetamask} from '../Common/links';
import PrimaryActionButton from '../Common/PrimaryActionButton';

const ConnectButton = (props: {styles?: string}) => {
    const context = useWeb3React();
    const {error} = context;
    const isNoEthereumProviderError = error instanceof NoEthereumProviderError;

    const dispatch = useAppDispatch();
    const onConnect = useOnConnect();

    const onWalletConnect = useCallback(() => {
        onConnect();
        dispatch(setConnected);
    }, [onConnect, dispatch]);

    return (
        <PrimaryActionButton
            styles={`${props.styles ?? ''}`}
            onClick={
                isNoEthereumProviderError ? safeOpenMetamask : onWalletConnect
            }
        >
            <span data-testid="connect-button_connect-button_text">
                {isNoEthereumProviderError
                    ? 'Install MetaMask'
                    : 'Connect Wallet'}
            </span>
        </PrimaryActionButton>
    );
};
export default ConnectButton;
