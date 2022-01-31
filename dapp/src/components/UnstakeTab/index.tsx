import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import UnstakeTable from '../UnstakeTable';
import './styles.scss';

export default function UnstakingTab(props: {rewardsBalance: string | null}) {
    return (
        <Box width={'100%'} margin={'0 5'}>
            <Card
                variant="outlined"
                sx={{
                    backgroundColor: '#2B334140',
                    borderRadius: '8px',
                }}
            >
                <UnstakingInfoMSG />
                <UnstakeTable />
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

const TotalUnclaimedRewards = (props: {rewardsBalance: string | null}) => (
    <Box className="total-unclaimed-container">
        <Box className="total-unclaimed-rewards">
            {props.rewardsBalance && (
                <>
                    <Typography variant="caption">
                        Total Unclaimed Rewards:
                    </Typography>
                    <Typography variant="caption">
                        {props.rewardsBalance}
                    </Typography>
                </>
            )}
        </Box>
    </Box>
);
