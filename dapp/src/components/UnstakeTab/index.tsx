import * as React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import {BigNumber, constants} from 'ethers';

import {formatCurrency} from '../../utils';
import UnstakeTable from '../UnstakeTable';

import './styles.scss';

export default function UnstakingTab(props: {
    rewardsBalance: BigNumber | null;
    fetchData: () => Promise<void>;
}) {
    return (
        <Box className="unstaking-tab-holder">
            <Card variant="outlined">
                <UnstakingInfoMSG />
                <UnstakeTable fetchData={props.fetchData} />
                <TotalUnclaimedRewards rewardsBalance={props.rewardsBalance} />
            </Card>
        </Box>
    );
}

const UnstakingInfoMSG = () => (
    <Box className="unstaking-info-message">
        <Typography variant="caption">
            Stake transactions must be staking for 7+ day to be eligible to
            unstake. Rewards are claimed once a transaction is unstaked.
        </Typography>
    </Box>
);

const TotalUnclaimedRewards = (props: {rewardsBalance: BigNumber | null}) => {
    const hasRewards =
        props.rewardsBalance && props.rewardsBalance.gt(constants.Zero);

    return (
        <Box className="total-unclaimed-container">
            {!hasRewards && (
                <Box className="total-unclaimed-rewards no-unclaimed-rewards">
                    <Typography variant="caption">No rewards yet</Typography>
                </Box>
            )}
            {props.rewardsBalance && hasRewards && (
                <Box className="total-unclaimed-rewards">
                    <Typography variant="caption">
                        Total Unclaimed Rewards:
                    </Typography>
                    <Typography variant="caption">
                        {formatCurrency(props.rewardsBalance)}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};
