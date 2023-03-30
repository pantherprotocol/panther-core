// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useEffect} from 'react';

import {Box} from '@mui/system';
import {useWeb3React} from '@web3-react/core';
import AdvancedStakingRewards from 'components/AdvancedStakingRewards';
import BalanceCard from 'components/BalanceCard';
import {MainPageWrapper} from 'components/MainPageWrapper';
import StakingUnstakingCard from 'components/StakingUnstakingCard';
import Welcome from 'components/Welcome';
import {useAppDispatch, useAppSelector} from 'redux/hooks';
import {getStakeTerms} from 'redux/slices/staking/stake-terms';
import {getTotalsOfAdvancedStakes} from 'redux/slices/staking/totals-of-advanced-stakes';
import {getZkpStakedBalance} from 'redux/slices/staking/zkp-staked-balance';
import {acknowledgedNotificationSelector} from 'redux/slices/ui/acknowledged-notifications';
import {getUTXOs} from 'redux/slices/wallet/utxos';
import {getZkpTokenBalance} from 'redux/slices/wallet/zkp-token-balance';

import './styles.scss';

const Staking = (): React.ReactElement => {
    const context = useWeb3React();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(getTotalsOfAdvancedStakes, context);
        dispatch(getZkpTokenBalance, context);
        dispatch(getZkpStakedBalance, context);
        dispatch(getUTXOs, {context});
        dispatch(getStakeTerms, context);
    }, [context, dispatch]);

    const firstVisit = useAppSelector(
        acknowledgedNotificationSelector('notFirstVisit'),
    );

    return (
        <MainPageWrapper>
            {!firstVisit ? (
                <Welcome />
            ) : (
                <Box className="staking-container">
                    <BalanceCard />
                    <Box className="apy-staking-right-panel">
                        <AdvancedStakingRewards />
                        <StakingUnstakingCard />
                    </Box>
                </Box>
            )}
        </MainPageWrapper>
    );
};

export default Staking;
