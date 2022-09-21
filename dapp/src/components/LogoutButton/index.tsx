import React, {useCallback} from 'react';

import {useWeb3React} from '@web3-react/core';

import {useAppDispatch} from '../../redux/hooks';
import {disconnectWallet} from '../../redux/slices/isWalletConnected';
import {resetUnclaimedClassicRewards} from '../../redux/slices/totalUnclaimedClassicRewards';
import {resetZkpStakedBalance} from '../../redux/slices/zkpStakedBalance';
import {resetZkpTokenBalance} from '../../redux/slices/zkpTokenBalance';
import {WalletHeaderActionButton} from '../Common/WalletHeaderActionButton';

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
            dispatch(disconnectWallet);
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
