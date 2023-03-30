// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {useEffect, useState} from 'react';
import * as React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import {useWeb3React} from '@web3-react/core';
import ConnectButton from 'components/ConnectButton';
import StakingInfo from 'components/StakeTab/StakingInfo';
import SwitchNetworkButton from 'components/SwitchNetworkButton';
import {useAppSelector} from 'redux/hooks';
import {stakeAmountSelector} from 'redux/slices/staking/stake-amount';
import {
    isStakingOpenSelector,
    termsPropertySelector,
} from 'redux/slices/staking/stake-terms';
import {zkpTokenBalanceSelector} from 'redux/slices/wallet/zkp-token-balance';
import {isWrongNetwork} from 'services/connectors';
import {CHAIN_IDS} from 'services/env';
import {switchNetwork} from 'services/wallet';
import {StakeType} from 'types/staking';

import {ExpectedRewardsCard} from './ExpectedRewardsCard';
import StakingBtn from './StakingBtn';
import StakingInput from './StakingInput';

import './styles.scss';

export default function StakeTab() {
    const context = useWeb3React();
    const {account, library, chainId, active, error} = context;
    const tokenBalance = useAppSelector(zkpTokenBalanceSelector);
    const minStake = useAppSelector(
        termsPropertySelector(chainId, StakeType.Advanced, 'minAmountScaled'),
    );

    const isAdvancedStakingOpen = useAppSelector(
        isStakingOpenSelector(chainId, StakeType.Advanced),
    );
    const amountToStake = useAppSelector(stakeAmountSelector);
    const [wrongNetwork, setWrongNetwork] = useState(false);

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
                    <StakingInput amountToStake={amountToStake} />
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
                    <SwitchNetworkButton onChange={switchNetwork} />
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
                    tokenBalance={tokenBalance}
                    minStake={minStake as number}
                />
            )}
        </Box>
    );
}
