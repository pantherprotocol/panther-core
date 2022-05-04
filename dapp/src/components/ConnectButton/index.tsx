import React from 'react';

import {Button} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';

import {safeOpenMetamask} from '../../components/Common/links';
import '../Common/buttons.scss';

export const ConnectButton = (props: {onConnect: any}) => {
    const context = useWeb3React();
    const {error} = context;
    const isNoEthereumProviderError = error instanceof NoEthereumProviderError;

    return (
        <div className="primary-action-button-holder">
            <Button
                className="primary-action-button"
                onClick={() => {
                    if (isNoEthereumProviderError) {
                        safeOpenMetamask();
                    } else {
                        props.onConnect();
                    }
                }}
            >
                {isNoEthereumProviderError
                    ? 'Install MetaMask'
                    : 'Connect Wallet'}
            </Button>
        </div>
    );
};
