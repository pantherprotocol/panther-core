import React from 'react';

import {Button} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import {CHAIN_IDS} from '../../services/env';
import {switchNetwork} from '../../services/wallet';
import '../Common/buttons.scss';

export const SwitchNetworkButton = (props: {defaultNetwork?: number}) => {
    const context = useWeb3React();
    const {chainId} = context;
    const targetNetwork = chainId ?? props.defaultNetwork ?? CHAIN_IDS[0];
    return (
        <div className="primary-action-button-holder">
            <Button
                className="primary-action-button"
                href="#"
                onClick={() => {
                    switchNetwork(targetNetwork);
                }}
            >
                Switch network
            </Button>
        </div>
    );
};
