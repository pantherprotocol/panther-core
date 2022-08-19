import {useCallback, useEffect, useState} from 'react';
import * as React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import {useWeb3React} from '@web3-react/core';
import {BigNumber, utils} from 'ethers';

import StakingInfo from '../../components/StakeTab/StakingInfo';
import {safeParseUnits} from '../../lib/numbers';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {
    calculateRewards,
    resetRewards,
} from '../../redux/slices/advancedStakePredictedRewards';
import {
    isStakingOpenSelector,
    termsSelector,
} from '../../redux/slices/stakeTerms';
import {zkpTokenBalanceSelector} from '../../redux/slices/zkpTokenBalance';
import {isWrongNetwork} from '../../services/connectors';
import {CHAIN_IDS} from '../../services/env';
import {StakeType} from '../../types/staking';
import ConnectButton from '../ConnectButton';
import SwitchNetworkButton from '../SwitchNetworkButton';

import {ExpectedRewardsCard} from './ExpectedRewardsCard';
import StakingBtn from './StakingBtn';
import StakingInput from './StakingInput';

import './styles.scss';

export default function StakeTab() {
    const context = useWeb3React();
    const {account, library, chainId, active, error} = context;
    const tokenBalance = useAppSelector(zkpTokenBalanceSelector);
    const minStake = useAppSelector(
        termsSelector(chainId, StakeType.Advanced, 'minAmountScaled'),
    );
    const minLockPeriod = useAppSelector(
        termsSelector(chainId, StakeType.Advanced, 'minLockPeriod'),
    );

    const isAdvancedStakingOpen = useAppSelector(
        isStakingOpenSelector(chainId, StakeType.Advanced),
    );

    const dispatch = useAppDispatch();
    const [wrongNetwork, setWrongNetwork] = useState(false);
    const [amountToStake, setAmountToStake] = useState<string>('');
    const [amountToStakeBN, setAmountToStakeBN] = useState<BigNumber | null>(
        null,
    );

    // For use when user types input
    const setStakingAmount = useCallback(
        (amount: string) => {
            setAmountToStake(amount);
            const bn = safeParseUnits(amount);
            if (bn) {
                setAmountToStakeBN(bn);
                dispatch(calculateRewards, [bn.toString(), minLockPeriod]);
            } else {
                dispatch(resetRewards);
            }
        },
        [dispatch, minLockPeriod],
    );

    // For use when user clicks Max button
    const setStakingAmountBN = useCallback(
        (amountBN: BigNumber) => {
            const amount = utils.formatEther(amountBN);
            setAmountToStake(amount);
            setAmountToStakeBN(amountBN);
            dispatch(calculateRewards, [amountBN.toString(), minLockPeriod]);
        },
        [dispatch, minLockPeriod],
    );

    useEffect((): any => {
        const wrongNetwork = isWrongNetwork(context, CHAIN_IDS);
        setWrongNetwork(wrongNetwork);

        if (wrongNetwork) {
            return;
        }

        if (account && library) {
            let stale = false;

            library.getBalance(account).then(() => {
                if (!stale) {
                    setWrongNetwork(isWrongNetwork(context, CHAIN_IDS));
                }
            });

            return () => {
                stale = true;
            };
        }
    }, [context, active, account, library, error]);

    return (
        <Box className="staking-tab-holder">
            {isAdvancedStakingOpen ? (
                <>
                    <StakingInput
                        setStakingAmount={setStakingAmount}
                        setStakingAmountBN={setStakingAmountBN}
                        amountToStake={amountToStake}
                    />
                    <Card variant="outlined" className="staking-info-card">
                        <CardContent className="staking-info-card-content">
                            <StakingInfo />

                            <ExpectedRewardsCard />
                        </CardContent>
                    </Card>
                </>
            ) : (
                <StakingInfo />
            )}

            {wrongNetwork && (
                <div className="buttons-holder">
                    <SwitchNetworkButton />
                </div>
            )}

            {!active && !wrongNetwork && (
                <div className="buttons-holder">
                    <ConnectButton />
                </div>
            )}

            {isAdvancedStakingOpen && active && !wrongNetwork && (
                <StakingBtn
                    amountToStake={amountToStake}
                    amountToStakeBN={amountToStakeBN}
                    tokenBalance={tokenBalance}
                    minStake={minStake as number}
                    setStakingAmount={setStakingAmount}
                />
            )}
        </Box>
    );
}
