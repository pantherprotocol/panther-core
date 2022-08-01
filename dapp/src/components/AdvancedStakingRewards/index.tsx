import React from 'react';

import {Box, Typography} from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import {useWeb3React} from '@web3-react/core';

import {formatPercentage} from '../../lib/format';
import {useAppSelector} from '../../redux/hooks';
import {termsSelector} from '../../redux/slices/stakeTerms';
import {chainHasAdvancedStaking} from '../../services/contracts';
import {getAdvStakingAPY} from '../../services/rewards';
import {StakeType} from '../../types/staking';

import './styles.scss';

function AdvancedStakingRewards() {
    const context = useWeb3React();
    const {chainId} = context;

    const advancedStakingAPY = getAdvStakingAPY(new Date().getTime());

    return (
        <Box className="advanced-staking-rewards">
            {chainHasAdvancedStaking(chainId) && <ClaimedProgress />}
            <RemainingDays />
            {advancedStakingAPY && (
                <StakingAPR advancedStakingAPY={advancedStakingAPY} />
            )}
        </Box>
    );
}

function ClaimedProgress() {
    return (
        <Box className="claimed-progress">
            <Typography className="title">Advanced Staking Rewards</Typography>
            <Box className="progress-holder">
                <LinearProgress className="progress" />
            </Box>
            <Typography className="claimed-value">
                950k / 2m zZKP claimed (49%)
            </Typography>
        </Box>
    );
}

function calcRemainingDays(allowedSince: number, allowedTill: number): string {
    const now = new Date().getTime() / 1000;

    let secsRemaining = 0;
    if (now < allowedSince) {
        secsRemaining = Number(allowedSince) - now;
    }
    if (allowedSince <= now && now < allowedTill) {
        secsRemaining = Number(allowedTill) - now;
    }

    if (secsRemaining < 0) {
        secsRemaining = 0;
    }
    return (secsRemaining / 3600 / 24).toFixed(1);
}

function RemainingDays() {
    const context = useWeb3React();
    const {chainId} = context;

    const allowedSince = useAppSelector(
        termsSelector(chainId!, StakeType.Advanced, 'allowedSince'),
    );

    const allowedTill = useAppSelector(
        termsSelector(chainId!, StakeType.Advanced, 'allowedTill'),
    );

    const daysRemaining =
        typeof allowedTill === 'number' && typeof allowedSince === 'number'
            ? calcRemainingDays(allowedSince, allowedTill)
            : '?';

    return (
        <Box className="remaining-days">
            <Typography className="value">
                {daysRemaining} <span>days</span>
            </Typography>
            <Typography className="text">Remaining</Typography>
        </Box>
    );
}

function StakingAPR(props: {advancedStakingAPY: number}) {
    return (
        <Box className="staking-apr">
            <Typography className="value">
                {formatPercentage(props.advancedStakingAPY / 100)}
            </Typography>
            <Typography className="text">Staking APR</Typography>
        </Box>
    );
}

export default AdvancedStakingRewards;
