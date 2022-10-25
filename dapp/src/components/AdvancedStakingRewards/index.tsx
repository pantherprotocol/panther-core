import React from 'react';

import {Box, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {utils} from 'ethers';
import moment from 'moment';

import ClaimedProgress from '../../components/ClaimedProgress';
import {formatPercentage} from '../../lib/format';
import {useAppSelector} from '../../redux/hooks';
import {termsSelector} from '../../redux/slices/staking/stakeTerms';
import {
    totalClaimedRewardsSelector,
    totalVestedRewardsSelector,
} from '../../redux/slices/staking/totalsOfAdvancedStakes';
import {getAdvStakingAPY} from '../../services/rewards';
import {StakeType} from '../../types/staking';

import './styles.scss';

function AdvancedStakingRewards() {
    const context = useWeb3React();
    const {active} = context;
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
                    <StakingAPR
                        advancedStakingAPY={advancedStakingAPY}
                        isConnected={active}
                    />
                )}
            </Box>
        </Box>
    );
}

function calcRemainingDays(
    _allowedSince: number,
    _allowedTill: number,
): [string, string] {
    const now = moment();
    const allowedSince = moment(_allowedSince * 1000);
    const allowedTill = moment(_allowedTill * 1000);

    if (moment(allowedSince).isSameOrAfter(allowedTill)) {
        return ['', '?'];
    }
    if (moment(now).isSameOrBefore(allowedSince)) {
        return ['Remaining', allowedSince.diff(now, 'days') + ' days'];
    }
    if (moment(now).isBetween(allowedSince, allowedTill)) {
        return ['Remaining', allowedTill.diff(now, 'days') + ' days'];
    }
    if (moment(now).isAfter(allowedTill)) {
        return ['Staking is closed', '0 days'];
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

export function StakingAPR(props: {
    advancedStakingAPY: number;
    isConnected: boolean;
}) {
    return (
        <Box
            className="staking-apr"
            data-testid="advanced-staking-rewards_staking-apr_container"
        >
            <Typography className="text">Staking APR</Typography>
            <Typography
                className="value"
                data-testid="advanced-staking-rewards_staking-apr_value"
            >
                {props.isConnected
                    ? formatPercentage(props.advancedStakingAPY / 100)
                    : '0'}
            </Typography>
        </Box>
    );
}

export default AdvancedStakingRewards;
