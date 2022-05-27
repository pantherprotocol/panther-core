import React from 'react';

import {Box, Typography} from '@mui/material';
import {constants} from 'ethers';

import {formatCurrency} from '../../../lib/format';
import {useAppSelector} from '../../../redux/hooks';
import {
    zkpUnclaimedRewardsSelector,
    zZkpUnclaimedRewardsSelector,
} from '../../../redux/slices/unclaimedStakesRewards';

import './styles.scss';

const TotalUnclaimedRewards = () => {
    const zkpRewardsBalance = useAppSelector(zkpUnclaimedRewardsSelector);
    const zZkpRewardsBalance = useAppSelector(zZkpUnclaimedRewardsSelector);
    const zkpGreaterThanZero =
        zkpRewardsBalance && zkpRewardsBalance.gt(constants.Zero);
    const zZkpGreaterThanZero =
        zZkpRewardsBalance && zZkpRewardsBalance.gt(constants.Zero);

    const hasRewards = zkpGreaterThanZero || zZkpGreaterThanZero;

    return (
        <Box className="total-unclaimed-container">
            {!hasRewards && (
                <Box className="total-unclaimed-rewards no-unclaimed-rewards">
                    <Typography variant="caption">No rewards yet</Typography>
                </Box>
            )}

            {hasRewards && (
                <Box className="total-rewards-earned">
                    <Typography variant="caption" className="title">
                        Total Rewards Earned:{' '}
                    </Typography>
                    {zkpGreaterThanZero && (
                        <Typography className="amount" variant="caption">
                            {formatCurrency(zkpRewardsBalance)}
                            {' ZKP'}
                        </Typography>
                    )}
                    {zZkpGreaterThanZero && (
                        <Typography className="amount" variant="caption">
                            {formatCurrency(zZkpRewardsBalance)}
                            {' zZKP'}
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
};
export default TotalUnclaimedRewards;
