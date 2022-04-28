import {useCallback, useEffect, useState} from 'react';
import * as React from 'react';

import {Box, Card, CardContent} from '@mui/material';
import {UnsupportedChainIdError, useWeb3React} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';
import {BigNumber, utils} from 'ethers';

import {useAppDispatch} from '../../redux/hooks';
import {getTotalStaked} from '../../redux/slices/totalStaked';
import {getZkpStakedBalance} from '../../redux/slices/zkpStakedBalance';
import {onWrongNetwork} from '../../services/connectors';
import {chainHasAdvancedStaking} from '../../services/contracts';
import {CHAIN_IDS} from '../../services/env';
import * as stakingService from '../../services/staking';
import {safeParseUnits} from '../../utils/helpers';
import {safeOpenMetamask} from '../Common/links';
import {ConnectButton} from '../ConnectButton';

import StakingBtn from './StakingBtn';
import StakingInfo from './StakingInfo';
import StakingInput from './StakingInput';
import StakingMethod from './StakingMethod';

import './styles.scss';

export default function StakeTab(props: {
    tokenBalance: BigNumber | null;
    fetchData: () => Promise<void>;
    onConnect: any;
    networkLogo?: string;
    switchNetwork: any;
}) {
    const context = useWeb3React();
    const dispatch = useAppDispatch();

    const {account, library, chainId, active, error} = context;
    const isNoEthereumProviderError = error instanceof NoEthereumProviderError;
    const [wrongNetwork, setWrongNetwork] = useState(false);
    const [amountToStake, setAmountToStake] = useState<string>('');
    const [amountToStakeBN, setAmountToStakeBN] = useState<BigNumber | null>(
        null,
    );
    const [, setStakedId] = useState<number | null>(null);
    const [stakeType, setStakeType] = useState<string>('classic');

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

    const setStakeMethodType = useCallback(
        async (selectedStakeMethod: string): Promise<void> => {
            await setStakeType(selectedStakeMethod);
        },
        [setStakeType],
    );

    const stake = useCallback(
        async (amount: BigNumber) => {
            if (!chainId || !account || !props.tokenBalance) {
                return;
            }
            const stakingTypeHex = utils.keccak256(
                utils.toUtf8Bytes(stakeType),
            );
            const stakingResponse = await stakingService.stake(
                library,
                chainId,
                account,
                amount,
                stakingTypeHex.slice(0, 10),
            );

            if (stakingResponse instanceof Error) {
                return;
            }
            setStakedId(Number(stakingResponse));
            setStakingAmount('');
            dispatch(getTotalStaked(context));
            dispatch(getZkpStakedBalance(context));
            props.fetchData();
        },
        [
            library,
            account,
            chainId,
            props,
            setStakingAmount,
            context,
            dispatch,
            stakeType,
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
            <StakingInput
                tokenBalance={props.tokenBalance}
                setStakingAmount={setStakingAmount}
                setStakingAmountBN={setStakingAmountBN}
                amountToStake={amountToStake}
                networkLogo={props.networkLogo}
            />
            <Card variant="outlined" className="staking-info-card">
                <CardContent className="staking-info-card-content">
                    <StakingInfo />
                    {chainHasAdvancedStaking(chainId) && (
                        <Box display={'flex'} justifyContent={'center'}>
                            <StakingMethod
                                stakeType={stakeType}
                                setStakeType={setStakeMethodType}
                            />
                        </Box>
                    )}
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

            {active && !wrongNetwork && (
                <StakingBtn
                    amountToStake={amountToStake}
                    amountToStakeBN={amountToStakeBN}
                    tokenBalance={props.tokenBalance}
                    stake={stake}
                />
            )}
        </Box>
    );
}
