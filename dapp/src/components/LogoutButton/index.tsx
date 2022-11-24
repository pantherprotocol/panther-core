// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useCallback} from 'react';

import {useWeb3React} from '@web3-react/core';
import {WalletHeaderActionButton} from 'components/Common/WalletHeaderActionButton';
import {useAppDispatch} from 'redux/hooks';
import {resetUnclaimedClassicRewards} from 'redux/slices/staking/total-unclaimed-classic-rewards';
import {resetZkpStakedBalance} from 'redux/slices/staking/zkp-staked-balance';
import {setDisconnected} from 'redux/slices/ui/is-wallet-connected';
import {resetZkpTokenBalance} from 'redux/slices/wallet/zkp-token-balance';

export const LogoutButton = () => {
    const context = useWeb3React();
    const dispatch = useAppDispatch();
    const {chainId, deactivate, active} = context;

    const disconnect = useCallback(async () => {
        if (active && chainId) {
            deactivate();
            dispatch(resetZkpTokenBalance);
            dispatch(resetZkpStakedBalance);
            dispatch(resetUnclaimedClassicRewards);
            dispatch(setDisconnected);
        }
    }, [active, chainId, deactivate, dispatch]);

    return (
        <WalletHeaderActionButton
            text="Disconnect"
            onClick={disconnect}
            data-testid="logout-button_wrapper"
        />
    );
};
