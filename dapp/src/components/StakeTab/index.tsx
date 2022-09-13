import {useEffect, useState} from 'react';
import * as React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import {useWeb3React} from '@web3-react/core';

import StakingInfo from '../../components/StakeTab/StakingInfo';
import {useAppSelector} from '../../redux/hooks';
import {stakeAmountSelector} from '../../redux/slices/stakeAmount';
import {
    isStakingOpenSelector,
    termsSelector,
} from '../../redux/slices/stakeTerms';
import {zkpTokenBalanceSelector} from '../../redux/slices/zkpTokenBalance';
import {isWrongNetwork} from '../../services/connectors';
import {CHAIN_IDS} from '../../services/env';
import {switchNetwork} from '../../services/wallet';
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
