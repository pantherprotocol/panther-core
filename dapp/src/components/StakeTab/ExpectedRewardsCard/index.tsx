import * as React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {BigNumber, utils} from 'ethers';

import {formatCurrency} from '../../../lib/format';
import {useAppSelector} from '../../../redux/hooks';
import {calculatedRewardsSelector} from '../../../redux/slices/advancedStakePredictedRewards';
import {StakingRewardTokenID} from '../../../types/staking';

import './styles.scss';

export function ExpectedRewardsCard() {
    const rewards = useAppSelector(calculatedRewardsSelector);
    const zZkp = rewards?.[StakingRewardTokenID.zZKP]; // string, 18 decimals
    const zZkpBN = zZkp && BigNumber.from(zZkp);
    const prp = rewards?.[StakingRewardTokenID.PRP]; // string, no decimals
    const prpBN = prp && utils.parseEther(prp);

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
                        {zZkpBN ? formatCurrency(zZkpBN) : '-'} zZKP
                    </Typography>
                </Box>
                <Box className="expected-rewards-card-content">
                    <Typography className="title">
                        Privacy Reward Points:
                    </Typography>
                    <Typography className="amount">
                        {prpBN
                            ? formatCurrency(prpBN, {
                                  decimals: 0,
                              })
                            : '-'}{' '}
                        PRP
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
