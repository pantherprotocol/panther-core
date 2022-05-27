import * as React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {BigNumber} from 'ethers';

import {formatCurrency} from '../../../lib/format';
import {useAppSelector} from '../../../redux/hooks';
import {calculatedRewardsSelector} from '../../../redux/slices/advancedStakePredictedRewards';
import {StakingRewardTokenID} from '../../../types/staking';

import './styles.scss';

export function ExpectedRewardsCard() {
    const rewards = useAppSelector(calculatedRewardsSelector);
    const prp = rewards?.[StakingRewardTokenID.PRP];
    const zZkp = rewards?.[StakingRewardTokenID.zZKP];

    return (
        <Box className="expected-rewards-card">
            <Typography className="expected-rewards-card-title">
                Your Expected Advanced Staking Rewards:
            </Typography>
            <Box className="expected-rewards-card-container">
                <Box className="expected-rewards-card-content">
                    <Typography className="title">
                        ZKP Staking Reward:
                    </Typography>
                    <Typography className="amount">
                        {zZkp ? formatCurrency(BigNumber.from(zZkp)) : '-'} zZKP
                    </Typography>
                </Box>
                <Box className="expected-rewards-card-content">
                    <Typography className="title">
                        Privacy Reward Points:
                    </Typography>
                    <Typography className="amount">
                        {prp ? formatCurrency(BigNumber.from(prp)) : '-'} PRP
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
