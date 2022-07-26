import React from 'react';

import {CHAIN_IDS} from '../../services/env';
import {switchNetwork} from '../../services/wallet';
import PrimaryActionButton from '../Common/PrimaryActionButton';

const SwitchNetworkButton = (props: {defaultNetwork?: number}) => {
    const targetNetwork = props.defaultNetwork ?? CHAIN_IDS[0];
    return (
        <PrimaryActionButton
            onClick={() => {
                switchNetwork(targetNetwork);
            }}
        >
            <span>Switch network</span>
        </PrimaryActionButton>
    );
};

export default SwitchNetworkButton;
