import React, {useState, useEffect, useCallback} from 'react';

import {Box, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {BigNumber, utils} from 'ethers';

import ClaimedProgress from '../../components/ClaimedProgress';
import {formatPercentage} from '../../lib/format';
import {useAppSelector} from '../../redux/hooks';
import {termsSelector} from '../../redux/slices/stakeTerms';
import {chainHasAdvancedStaking} from '../../services/contracts';
import {
    getAdvStakingAPY,
    rewardsVested,
    rewardsClaimed,
} from '../../services/rewards';
import {StakeType} from '../../types/staking';

import './styles.scss';

function AdvancedStakingRewards() {
    const [total, setTotal] = useState<number>(0);
    const [claimed, setClaimed] = useState<number>(0);
    const context = useWeb3React();
    const {chainId} = context;

    const advancedStakingAPY = getAdvStakingAPY(new Date().getTime());

    const updateStateViaCallingSmartContract = useCallback(
        async (
            smartContractGetter: () => Promise<BigNumber | Error>,
            stateSetter: (v: number) => void,
        ) => {
            const value = await smartContractGetter();
            if (!value || value instanceof Error) {
                return null;
            }
            stateSetter(Number(utils.formatEther(value)));
        },
        [],
    );

    useEffect(() => {
        updateStateViaCallingSmartContract(rewardsVested, setTotal);
        updateStateViaCallingSmartContract(rewardsClaimed, setClaimed);
    }, [chainId, updateStateViaCallingSmartContract]);

    return (
        <Box className="advanced-staking-rewards">
            {chainHasAdvancedStaking(chainId) && (
                <ClaimedProgress claimed={claimed} total={total} />
            )}
            <RemainingDays />
            {advancedStakingAPY && (
                <StakingAPR advancedStakingAPY={advancedStakingAPY} />
            )}
        </Box>
    );
}

function calcRemainingDays(allowedSince: number, allowedTill: number): string {
    const now = new Date().getTime() / 1000;

    let secsRemaining = 0;
    if (now < allowedSince) {
        secsRemaining = Number(allowedSince) - now;
    }
    if (allowedSince <= now && now < allowedTill) {
        secsRemaining = Number(allowedTill) - now;
    }

    if (secsRemaining < 0) {
        secsRemaining = 0;
    }
    return (secsRemaining / 3600 / 24).toFixed(1);
}

function RemainingDays() {
    const context = useWeb3React();
    const {chainId} = context;

    const allowedSince = useAppSelector(
        termsSelector(chainId!, StakeType.Advanced, 'allowedSince'),
    );

    const allowedTill = useAppSelector(
        termsSelector(chainId!, StakeType.Advanced, 'allowedTill'),
    );

    const daysRemaining =
        typeof allowedTill === 'number' && typeof allowedSince === 'number'
            ? calcRemainingDays(allowedSince, allowedTill)
            : '?';

    return (
        <Box className="remaining-days">
            <Typography className="value">
                {daysRemaining} <span>days</span>
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
