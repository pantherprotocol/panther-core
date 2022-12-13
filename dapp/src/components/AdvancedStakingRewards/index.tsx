// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {Box, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import StakingAPR from 'components/StakingAPR';
import {isAfter} from 'date-fns';
import {utils} from 'ethers';
import {
    totalClaimedRewardsSelector,
    totalVestedRewardsSelector,
} from 'redux/slices/staking/totals-of-advanced-stakes';
import {getAdvStakingAPY} from 'services/rewards';
import {StakeType} from 'types/staking';

import ClaimedProgress from '../../components/ClaimedProgress';
import {formatRemainingPeriod} from '../../lib/format';
import {useAppSelector} from '../../redux/hooks';
import {termsSelector} from '../../redux/slices/staking/stake-terms';

import './styles.scss';

function AdvancedStakingRewards() {
    const claimed = useAppSelector(totalClaimedRewardsSelector);
    const total = useAppSelector(totalVestedRewardsSelector);
    const advancedStakingAPY = getAdvStakingAPY(new Date().getTime());

    return (
        <Box
            className="advanced-staking-rewards"
            data-testid="advanced-staking-rewards_advanced-staking-rewards_container"
        >
            <ClaimedProgress
                claimed={claimed ? Number(utils.formatEther(claimed)) : 0}
                total={total ? Number(utils.formatEther(total)) : 0}
            />

            <Box className="info-wrapper">
                <RemainingDays />
                {advancedStakingAPY && (
                    <StakingAPR advancedStakingAPY={advancedStakingAPY} />
                )}
            </Box>
        </Box>
    );
}

function calcRemainingDays(
    _allowedSince: number,
    _allowedTill: number,
): [string, string] {
    const now = new Date();
    const allowedSince = new Date(_allowedSince * 1000);
    const allowedTill = new Date(_allowedTill * 1000);
    const nowIsBetween = now > allowedSince && now < allowedTill;

    if (isAfter(allowedSince, allowedTill)) {
        return ['', '?'];
    }
    if (isAfter(allowedSince, now)) {
        return ['Remaining', formatRemainingPeriod(allowedSince)];
    }
    if (nowIsBetween) {
        return ['Remaining', formatRemainingPeriod(allowedTill)];
    }
    if (isAfter(now, allowedTill)) {
        return ['Staking is closed', ''];
    }
    return ['', '0 days'];
}

function RemainingDays() {
    const context = useWeb3React();
    const {chainId} = context;

    let allowedSince = useAppSelector(
        termsSelector(chainId!, StakeType.Advanced, 'allowedSince'),
    );

    let allowedTill = useAppSelector(
        termsSelector(chainId!, StakeType.Advanced, 'allowedTill'),
    );

    // Falling back to env variables if terms are not loaded
    allowedSince = allowedSince ?? Number(process.env.ADVANCED_STAKING_T_START);
    allowedTill = allowedTill ?? Number(process.env.ADVANCED_STAKING_T_END);

    const [title, daysRemaining]: [string, string] =
        typeof allowedTill === 'number' && typeof allowedSince === 'number'
            ? calcRemainingDays(allowedSince, allowedTill)
            : ['Connect Wallet', '-'];

    return (
        <Box
            className="remaining-days"
            data-testid="advanced-staking-rewards_remaining-days_container"
        >
            <Typography className="text">{title}</Typography>
            <Typography className="value">{daysRemaining}</Typography>
        </Box>
    );
}

export default AdvancedStakingRewards;
