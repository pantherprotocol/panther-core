import {useCallback, useEffect, useState} from 'react';
import * as React from 'react';

import {Box, Card, CardContent} from '@mui/material';
import {UnsupportedChainIdError, useWeb3React} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';
import {BigNumber, utils} from 'ethers';

import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {getTotalStaked} from '../../redux/slices/totalStaked';
import {resetUnclaimedRewards} from '../../redux/slices/unclaimedStakesRewards';
import {getZkpStakedBalance} from '../../redux/slices/zkpStakedBalance';
import {
    getZkpTokenBalance,
    zkpTokenBalanceSelector,
} from '../../redux/slices/zkpTokenBalance';
import {onWrongNetwork} from '../../services/connectors';
import {CHAIN_IDS} from '../../services/env';
import * as stakingService from '../../services/staking';
import {chainHasStakingOpen} from '../../services/staking';
import {safeParseUnits} from '../../utils/helpers';
import {safeOpenMetamask} from '../Common/links';
import {ConnectButton} from '../ConnectButton';

import StakingBtn from './StakingBtn';
import StakingInfo from './StakingInfo';
import StakingInput from './StakingInput';

import './styles.scss';

export default function StakeTab(props: {
    onConnect: any;
    networkLogo?: string;
    switchNetwork: any;
}) {
    const context = useWeb3React();
    const tokenBalance = useAppSelector(zkpTokenBalanceSelector);
    const dispatch = useAppDispatch();

    const {account, library, chainId, active, error} = context;
    const isNoEthereumProviderError = error instanceof NoEthereumProviderError;
    const [wrongNetwork, setWrongNetwork] = useState(false);
    const [amountToStake, setAmountToStake] = useState<string>('');
    const [amountToStakeBN, setAmountToStakeBN] = useState<BigNumber | null>(
        null,
    );
    const [, setStakedId] = useState<number | null>(null);

    // For use when user types input
    const setStakingAmount = useCallback((amount: string) => {
        setAmountToStake(amount);
        const bn = safeParseUnits(amount);
        if (bn) {
            setAmountToStakeBN(bn);
        }
    }, []);

    // For use when user clicks Max button
    const setStakingAmountBN = useCallback((amountBN: BigNumber) => {
        const amount = utils.formatEther(amountBN);
        setAmountToStake(amount);
        setAmountToStakeBN(amountBN);
    }, []);

    const stake = useCallback(
        async (amount: BigNumber) => {
            if (!chainId || !account || !tokenBalance) {
                return;
            }

            const stakingResponse = await stakingService.advancedStake(
                library,
                chainId,
                account,
                amount,
            );

            if (stakingResponse instanceof Error) {
                return;
            }
            setStakedId(Number(stakingResponse));
            setStakingAmount('');
            dispatch(getTotalStaked(context));
            dispatch(getZkpStakedBalance(context));
            dispatch(getZkpTokenBalance(context));
            dispatch(resetUnclaimedRewards());
        },
        [
            library,
            account,
            chainId,
            setStakingAmount,
            context,
            dispatch,
            tokenBalance,
        ],
    );

    useEffect((): any => {
        const wrongNetwork =
            onWrongNetwork(context) || error instanceof UnsupportedChainIdError;
        setWrongNetwork(wrongNetwork);
        console.debug(
            'header: wrongNetwork',
            wrongNetwork,
            '/ active',
            active,
            '/ error',
            error,
        );
        if (wrongNetwork) {
            return;
        }

        if (account && library) {
            let stale = false;

            library.getBalance(account).then(() => {
                if (!stale) {
                    setWrongNetwork(onWrongNetwork(context));
                }
            });

            return () => {
                stale = true;
            };
        }
    }, [context, active, account, library, error]);

    return (
        <Box className="staking-tab-holder">
            {chainHasStakingOpen(chainId) && (
                <StakingInput
                    setStakingAmount={setStakingAmount}
                    setStakingAmountBN={setStakingAmountBN}
                    amountToStake={amountToStake}
                    networkLogo={props.networkLogo}
                />
            )}
            <Card variant="outlined" className="staking-info-card">
                <CardContent className="staking-info-card-content">
                    <StakingInfo />
                </CardContent>
            </Card>

            {wrongNetwork && (
                <div className="buttons-holder">
                    <ConnectButton
                        text={'Switch network'}
                        onClick={() => {
                            const chainIdToSwitch = chainId
                                ? chainId
                                : CHAIN_IDS[0];
                            props.switchNetwork(chainIdToSwitch);
                        }}
                    />
                </div>
            )}

            {!active && !wrongNetwork && (
                <div className="buttons-holder">
                    <ConnectButton
                        text={
                            isNoEthereumProviderError
                                ? 'Install MetaMask'
                                : 'Connect Wallet'
                        }
                        onClick={() => {
                            if (isNoEthereumProviderError) {
                                safeOpenMetamask();
                            } else {
                                props.onConnect();
                            }
                        }}
                    />
                </div>
            )}

            {chainHasStakingOpen(chainId) && active && !wrongNetwork && (
                <StakingBtn
                    amountToStake={amountToStake}
                    amountToStakeBN={amountToStakeBN}
                    stake={stake}
                />
            )}
        </Box>
    );
}
