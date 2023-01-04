// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import PrimaryActionButton from 'components/common/PrimaryActionButton';
import {CHAIN_IDS} from 'services/env';

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
