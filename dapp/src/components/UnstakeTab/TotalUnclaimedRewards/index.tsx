import React from 'react';

import {Box, Typography} from '@mui/material';
import {constants} from 'ethers';

import {useAppSelector} from '../../../redux/hooks';
import {zkpUnclaimedRewardsSelector} from '../../../redux/slices/unclaimedStakesRewards';
import {formatCurrency} from '../../../utils/helpers';

import './styles.scss';

const TotalUnclaimedRewards = () => {
    const rewardsBalance = useAppSelector(zkpUnclaimedRewardsSelector);
    const hasRewards = rewardsBalance && rewardsBalance.gt(constants.Zero);

    return (
        <Box className="total-unclaimed-container">
            {!hasRewards && (
                <Box className="total-unclaimed-rewards no-unclaimed-rewards">
                    <Typography variant="caption">No rewards yet</Typography>
                </Box>
            )}
            {rewardsBalance && hasRewards && (
                <Box className="total-unclaimed-rewards">
                    <Typography variant="caption">
                        Total Unclaimed Rewards:{' '}
                        {formatCurrency(rewardsBalance)}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};
export default TotalUnclaimedRewards;
