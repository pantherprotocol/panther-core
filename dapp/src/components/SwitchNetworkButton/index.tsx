import React from 'react';

import {CHAIN_IDS} from '../../services/env';
import PrimaryActionButton from '../Common/PrimaryActionButton';

const SwitchNetworkButton = (props: {
    defaultNetwork?: number;
    onChange: (chainId: number) => void;
}) => {
    const targetNetwork = props.defaultNetwork ?? CHAIN_IDS[0];
    return (
        <PrimaryActionButton
            onClick={() => {
                props.onChange(targetNetwork);
            }}
            data-testid="switch-network-button_container"
        >
            <span>Switch network</span>
        </PrimaryActionButton>
    );
};

export default SwitchNetworkButton;
