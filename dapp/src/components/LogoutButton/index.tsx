import React, {useCallback} from 'react';

import Button from '@mui/material/Button';
import {useWeb3React} from '@web3-react/core';

import {useAppDispatch} from '../../redux/hooks';
import {resetUnclaimedRewards} from '../../redux/slices/unclaimedRewards';
import {resetZkpStakedBalance} from '../../redux/slices/zkpStakedBalance';
import {resetZkpTokenBalance} from '../../redux/slices/zkpTokenBalance';

import './styles.scss';

export const LogoutButton = () => {
    const context = useWeb3React();
    const dispatch = useAppDispatch();
    const {chainId, deactivate, active} = context;

    const disconnect = useCallback(async () => {
        if (active && chainId) {
            deactivate();
            dispatch(resetZkpTokenBalance());
            dispatch(resetZkpStakedBalance());
            dispatch(resetUnclaimedRewards());
        }
    }, [active, chainId, deactivate, dispatch]);

    return (
        <div className="logout-button-holder">
            <Button className="logout-button" onClick={() => disconnect()}>
                Logout
            </Button>
        </div>
    );
};
