import * as React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {BigNumber} from 'ethers';

import {formatCurrency} from '../../../lib/format';
import {useAppSelector} from '../../../redux/hooks';
import {calculatedRewardsSelector} from '../../../redux/slices/advancedStakePredictedRewards';
import {remainingPrpRewardsSelector} from '../../../redux/slices/remainingPrpRewards';
import {StakingRewardTokenID} from '../../../types/staking';

import './styles.scss';

function expectedPrpRewards(
    predictedRewards: string | null | undefined,
    remainingRewards: string | null,
): BigNumber {
    const remainingRewardsBN = BigNumber.from(remainingRewards ?? '0');
    const predictedRewardsBN = BigNumber.from(predictedRewards ?? '0');

    return remainingRewardsBN.lt(predictedRewardsBN)
        ? remainingRewardsBN
        : predictedRewardsBN;
}

export function ExpectedRewardsCard() {
    const rewards = useAppSelector(calculatedRewardsSelector);
    const zZkp = rewards?.[StakingRewardTokenID.zZKP]; // string, 18 decimals
    const zZkpBN = zZkp && BigNumber.from(zZkp);
    const predictedRewards = rewards?.[StakingRewardTokenID.PRP]; // string, no decimals
    const remainingRewards = useAppSelector(remainingPrpRewardsSelector);

    const prpBN: BigNumber = expectedPrpRewards(
        predictedRewards,
        remainingRewards,
    );

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
                        {zZkpBN ? formatCurrency(zZkpBN) : '0.00'} zZKP
                    </Typography>
                </Box>
                <Box className="expected-rewards-card-content">
                    <Typography className="title">
                        Privacy Reward Points:
                    </Typography>
                    <Typography className="amount">
                        {formatCurrency(prpBN, {
                            decimals: 0,
                            scale: 0,
                        })}{' '}
                        PRP
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
