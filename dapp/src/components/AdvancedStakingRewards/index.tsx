import React from 'react';

import {Box, Typography} from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import {useWeb3React} from '@web3-react/core';

import {chainHasAdvancedStaking} from '../../services/contracts';
import {getAdvStakingAPY} from '../../services/rewards';
import {formatPercentage} from '../../utils/helpers';

import './styles.scss';

function AdvancedStakingRewards() {
    const context = useWeb3React();

    const {chainId} = context;

    const advancedStakingAPY = getAdvStakingAPY(new Date().getTime());

    return (
        <Box className="advanced-staking-rewards">
            {chainHasAdvancedStaking(chainId) && <ClaimedProgress />}
            <RemainingDays />
            {advancedStakingAPY && (
                <StakingAPR advancedStakingAPY={advancedStakingAPY} />
            )}
        </Box>
    );
}

function ClaimedProgress() {
    return (
        <Box className="claimed-progress">
            <Typography className="title">Advanced Staking Rewards</Typography>
            <Box className="progress-holder">
                <LinearProgress className="progress" />
            </Box>
            <Typography className="claimed-value">
                950k / 2m zZKP claimed (49%)
            </Typography>
        </Box>
    );
}

function RemainingDays() {
    return (
        <Box className="remaining-days">
            <Typography className="value">
                29 <span> days</span>
            </Typography>
            <Typography className="text">Remaining</Typography>
        </Box>
    );
}

function StakingAPR(props: {advancedStakingAPY: number}) {
    return (
        <Box className="staking-apr">
            <Typography className="value">
                {formatPercentage(props.advancedStakingAPY / 100)}
            </Typography>
            <Typography className="text">Staking APR</Typography>
        </Box>
    );
}

export default AdvancedStakingRewards;
