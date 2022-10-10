import * as React from 'react';

import {IconButton} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import questionmarkIcon from '../../../images/questionmark-icon.svg';
import {formatCurrency} from '../../../lib/format';
import {useAppSelector} from '../../../redux/hooks';
import {calculatedRewardsSelector} from '../../../redux/slices/advancedStakePredictedRewards';
import {StakingRewardTokenID} from '../../../types/staking';

import './styles.scss';

export function ExpectedRewardsCard() {
    const rewards = useAppSelector(calculatedRewardsSelector);
    const zZkpBN = rewards?.[StakingRewardTokenID.zZKP];
    const predictedRewardsBN = rewards?.[StakingRewardTokenID.PRP];

    return (
        <Box className="expected-rewards-card">
            <Typography className="expected-rewards-card-title">
                Advanced Staking Rewards:
            </Typography>
            <Box className="expected-rewards-card-container">
                <Box className="expected-rewards-card-content">
                    <Typography className="title">
                        ZKP Staking Reward:
                        <IconButton>
                            <img src={questionmarkIcon} />
                        </IconButton>
                    </Typography>
                    <Typography className="amount">
                        {zZkpBN ? `${formatCurrency(zZkpBN)} zZKP` : '-'}
                    </Typography>
                </Box>
                <Box className="expected-rewards-card-content">
                    <Typography className="title">
                        Privacy Reward Points:
                        <IconButton>
                            <img src={questionmarkIcon} />
                        </IconButton>
                    </Typography>

                    <Typography className="amount">
                        {predictedRewardsBN
                            ? `${formatCurrency(predictedRewardsBN, {
                                  decimals: 0,
                                  scale: 0,
                              })} PRP`
                            : '-'}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
