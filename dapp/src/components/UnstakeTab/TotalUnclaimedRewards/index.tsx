import React from 'react';

import {Box, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {constants} from 'ethers';
import {formatCurrency} from 'lib/format';
import {useAppSelector} from 'redux/hooks';
import {totalUnclaimedClassicRewardsSelector} from 'redux/slices/staking/totalUnclaimedClassicRewards';
import {totalSelector} from 'redux/slices/wallet/advancedStakesRewards';
import {StakingRewardTokenID} from 'types/staking';

import './styles.scss';

const TotalUnclaimedRewards = () => {
    const {account, chainId} = useWeb3React();
    const zkpRewardsBalance = useAppSelector(
        totalUnclaimedClassicRewardsSelector,
    );
    const zZkpRewardsBalance = useAppSelector(
        totalSelector(chainId, account, StakingRewardTokenID.zZKP),
    );
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
