import React, {useCallback} from 'react';

import {useWeb3React} from '@web3-react/core';
import {WalletHeaderActionButton} from 'components/Common/WalletHeaderActionButton';
import {useAppDispatch} from 'redux/hooks';
import {resetUnclaimedClassicRewards} from 'redux/slices/staking/totalUnclaimedClassicRewards';
import {resetZkpStakedBalance} from 'redux/slices/staking/zkpStakedBalance';
import {setDisconnected} from 'redux/slices/ui/isWalletConnected';
import {resetZkpTokenBalance} from 'redux/slices/wallet/zkpTokenBalance';

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
