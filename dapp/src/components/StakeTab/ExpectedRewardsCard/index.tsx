import * as React from 'react';

import {IconButton, Tooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import questionmarkIcon from '../../../images/questionmark-icon.svg';
import {formatCurrency} from '../../../lib/format';
import {useAppSelector} from '../../../redux/hooks';
import {calculatedRewardsSelector} from '../../../redux/slices/staking/advancedStakePredictedRewards';
import {StakingRewardTokenID} from '../../../types/staking';

import './styles.scss';

export function ExpectedRewardsCard() {
    const rewards = useAppSelector(calculatedRewardsSelector);
    const zZkpBN = rewards?.[StakingRewardTokenID.zZKP];
    const predictedRewardsBN = rewards?.[StakingRewardTokenID.PRP];

    const zZkpTooltip = `zZKP rewards generated upon staking in the Multi-Asset Shielded Pool (MASP). Staking is not possible in the case of zero zZKP rewards.`;

    const prpTooltip = `PRPs (Panther Reward Points). This additional reward, aimed toward incentivizing Advanced Staking, will also be created in the Shielded Pool as a calculation based on the number of $zZKP for a given user. Users will be able to convert PRPs to $zZKP using the Reward Converter when the core protocol (Panther Core V1) launches.`;

    return (
        <Box className="expected-rewards-card">
            <Typography className="expected-rewards-card-title">
                Advanced Staking Rewards:
            </Typography>
            <Box className="expected-rewards-card-container">
                <Box className="expected-rewards-card-content">
                    <Typography className="title">
                        ZKP Staking Reward:
                        <Tooltip
                            title={zZkpTooltip}
                            data-html="true"
                            placement="top"
                            className="tooltip-icon"
                        >
                            <IconButton>
                                <img src={questionmarkIcon} />
                            </IconButton>
                        </Tooltip>
                    </Typography>
                    <Typography className="amount">
                        {zZkpBN ? `${formatCurrency(zZkpBN)} zZKP` : '-'}
                    </Typography>
                </Box>
                <Box className="expected-rewards-card-content">
                    <Typography className="title">
                        Privacy Reward Points:
                        <Tooltip
                            title={prpTooltip}
                            data-html="true"
                            placement="top"
                            className="tooltip-icon"
                        >
                            <IconButton>
                                <img src={questionmarkIcon} />
                            </IconButton>
                        </Tooltip>
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
