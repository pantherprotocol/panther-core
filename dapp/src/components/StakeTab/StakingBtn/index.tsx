// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {useCallback} from 'react';
import * as React from 'react';

import {Box, Button} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {notifyError} from 'components/common/errors';
import {MessageWithTx} from 'components/common/MessageWithTx';
import {
    openNotification,
    removeNotification,
} from 'components/common/notification';
import {BigNumber, utils} from 'ethers';
import {awaitConfirmationAndRetrieveEvent} from 'lib/events';
import {formatCurrency} from 'lib/format';
import {safeParseUnits, countNumberOfDecimals} from 'lib/numbers';
import {sleep} from 'lib/time';
import {useAppDispatch, useAppSelector} from 'redux/hooks';
import {
    calculatedRewardsSelector,
    resetRewards,
} from 'redux/slices/staking/advanced-stake-predicted-rewards';
import {resetStakeAmount} from 'redux/slices/staking/stake-amount';
import {getStakes} from 'redux/slices/staking/stakes';
import {getTotalUnclaimedClassicRewards} from 'redux/slices/staking/total-unclaimed-classic-rewards';
import {
    getTotalsOfAdvancedStakes,
    totalLeftRewardsSelector,
} from 'redux/slices/staking/totals-of-advanced-stakes';
import {getZkpStakedBalance} from 'redux/slices/staking/zkp-staked-balance';
import {
    startWalletAction,
    StartWalletActionPayload,
    registerWalletActionFailure,
    progressToNewWalletAction,
    registerWalletActionSuccess,
    WalletActionTrigger,
    walletActionCauseSelector,
    walletActionStatusSelector,
} from 'redux/slices/ui/web3-wallet-last-action';
import {getAdvancedStakesRewardsAndUpdateStatus} from 'redux/slices/wallet/advanced-stakes-rewards';
import {getChainBalance} from 'redux/slices/wallet/chain-balance';
import {getZkpTokenBalance} from 'redux/slices/wallet/zkp-token-balance';
import {chainHasAdvancedStaking} from 'services/contracts';
import {MultiError} from 'services/errors';
import {generateRootKeypairs} from 'services/keys';
import {advancedStake} from 'services/staking';
import {StakingRewardTokenID} from 'types/staking';

import './styles.scss';

const getButtonText = (
    amount: string | null,
    amountBN: BigNumber | null,
    minStake: number | null,
    maxZZkpReward: BigNumber | null,
    tokenBalance: BigNumber | null,
    zZkpBN: BigNumber | null | undefined,
): [string, boolean] => {
    if (minStake === null) {
        return ["Couldn't get minimum stake", false];
    }
    if (maxZZkpReward === null) {
        return ["Couldn't get max zZKP reward", false];
    }
    if (!tokenBalance) {
        return ["Couldn't get token balance", false];
    }
    if (!amount || !amountBN) {
        return ['Enter amount of ZKP to stake above', false];
    }
    if (!zZkpBN) {
        return ["Couldn't get zZKP reward estimate", false];
    }

    if (amountBN.gt(tokenBalance)) {
        console.debug(
            'Insufficient ZKP balance:',
            utils.formatEther(amountBN),
            '>',
            utils.formatEther(tokenBalance),
        );
        return ['Insufficient ZKP balance', false];
    }

    if (amountBN.gte(utils.parseEther(minStake.toString()))) {
        if (zZkpBN.lt(utils.parseEther('0.01'))) {
            console.debug(
                `Insufficient zZKP rewards to stake: ${utils.formatEther(
                    zZkpBN!,
                )} <0.01`,
            );

            return ['Insufficient zZKP rewards to stake', false];
        }

        if (zZkpBN.gt(maxZZkpReward)) {
            console.debug(
                'The reward cannot be greater than available in the pool',
            );

            return [
                `The reward cannot be greater than available in the pool: ${utils.formatEther(
                    maxZZkpReward,
                )} zZKP`,
                false,
            ];
        }

        console.debug(
            'Sufficient ZKP balance:',
            utils.formatEther(amountBN),
            amountBN.eq(tokenBalance) ? '==' : '<=',
            utils.formatEther(tokenBalance),
        );

        const numOfDecimals = countNumberOfDecimals(amountBN);
        // We display amount rather than stringifying amountBN, because we want
        // to make sure we display the same amount which is visible in the
        // staking amount field, and this is not guaranteed to be the same
        // due to rounding discrepancies, e.g. if Max button is clicked.
        return [
            `STAKE ${
                amountBN
                    ? formatCurrency(amountBN, {
                          decimals: numOfDecimals === 3 ? 3 : 2,
                      })
                    : '0.00'
            } ZKP`,
            true,
        ];
    }
    console.debug('Below minimum stake amount:', utils.formatEther(amountBN));
    return [`Stake amount must be at least ${minStake} ZKP`, false];
};

const StakingBtn = (props: {
    amountToStake: string | null;
    minStake: number | null;
    tokenBalance: BigNumber | null;
}) => {
    const amountToStakeBN = safeParseUnits(props.amountToStake);
    const context = useWeb3React();
    const {account, library, chainId} = context;
    const dispatch = useAppDispatch();

    const {amountToStake, minStake, tokenBalance} = props;

    const rewards = useAppSelector(calculatedRewardsSelector);
    const zZkpBN = rewards?.[StakingRewardTokenID.zZKP];
    const maxZZkpReward = useAppSelector(totalLeftRewardsSelector);

    const [buttonText, ready] = getButtonText(
        amountToStake,
        amountToStakeBN,
        minStake,
        maxZZkpReward,
        tokenBalance,
        zZkpBN,
    );

    const walletActionCause = useAppSelector(walletActionCauseSelector);
    const walletActionStatus = useAppSelector(walletActionStatusSelector);

    const anotherStakingInProgress =
        walletActionCause?.trigger === 'stake' &&
        walletActionStatus === 'in progress';

    const canStake = ready && !anotherStakingInProgress;
    const activeClass = canStake ? 'active' : '';

    const stake = useCallback(
        async (amount: BigNumber, trigger: WalletActionTrigger) => {
            if (!chainId || !account || !tokenBalance) {
                return;
            }

            dispatch(startWalletAction, {
                name: 'signMessage',
                cause: {caller: 'StakeTab', trigger},
                data: {account},
            } as StartWalletActionPayload);

            const signer = library.getSigner(account);
            const keys = await generateRootKeypairs(signer);

            if (keys instanceof MultiError) {
                dispatch(registerWalletActionFailure, 'signMessage');
                notifyError({
                    errorLabel: 'Failed to create stake',
                    message: keys.message,
                    triggerError: keys,
                });
                return;
            }

            dispatch(progressToNewWalletAction, {
                oldAction: 'signMessage',
                newAction: {
                    name: 'stake',
                    cause: {caller: 'StakeTab', trigger},
                    data: {account},
                },
            });
            if (!chainHasAdvancedStaking(chainId)) {
                notifyError({
                    errorLabel: 'Error during stake',
                    message: 'Advanced staking is not supported on this chain',
                });
                dispatch(registerWalletActionFailure, 'stake');

                return;
            }

            const response = await advancedStake(
                library,
                chainId,
                keys,
                account,
                amount,
            );

            if (response instanceof MultiError) {
                dispatch(registerWalletActionFailure, 'stake');
                openNotification(
                    'Transaction error',
                    response.message,
                    'danger',
                );
                return;
            }

            const inProgress = openNotification(
                'Transaction in progress',
                <MessageWithTx
                    message="Your staking transaction is currently in progress. Please wait for confirmation!"
                    chainId={chainId}
                    txHash={response?.hash}
                />,

                'info',
            );

            const event = await awaitConfirmationAndRetrieveEvent(
                response,
                'StakeCreated',
            );

            removeNotification(inProgress);

            if (event instanceof MultiError) {
                dispatch(registerWalletActionFailure, 'stake');

                openNotification(
                    'Transaction error',
                    <MessageWithTx
                        message={event.message}
                        chainId={chainId}
                        txHash={response?.hash}
                    />,

                    'danger',
                );
                return;
            }

            openNotification(
                'Stake completed successfully',
                <MessageWithTx
                    message="Congratulations! Your staking transaction was processed!"
                    chainId={chainId}
                    txHash={response?.hash}
                />,

                'info',
                10000,
            );

            dispatch(registerWalletActionSuccess, 'stake');
            dispatch(progressToNewWalletAction, {
                oldAction: 'stake',
                newAction: {
                    name: 'getAdvancedStakesRewardsAndUpdateStatus',
                    cause: {caller: 'StakeTab', trigger},
                    data: {account, caller: 'components/StakeTab'},
                },
            });

            dispatch(getAdvancedStakesRewardsAndUpdateStatus, {
                context,
                keys,
                withRetry: true,
            });

            dispatch(
                registerWalletActionSuccess,
                'getAdvancedStakesRewardsAndUpdateStatus',
            );
            dispatch(getStakes, context);
            dispatch(getTotalsOfAdvancedStakes, context);
            dispatch(getZkpStakedBalance, context);
            dispatch(getZkpTokenBalance, context);
            dispatch(getTotalUnclaimedClassicRewards, context);
            dispatch(getChainBalance, context);
            dispatch(resetStakeAmount);
            dispatch(resetRewards);
            // sleeping for 10 seconds to give nonce to propagate to all nodes
            // before staking the next time
            await sleep(10000);
            dispatch(
                registerWalletActionSuccess,
                'getAdvancedStakesRewardsAndUpdateStatus',
            );
        },
        [library, account, chainId, context, dispatch, tokenBalance],
    );

    return (
        <Box className={`buttons-holder ${activeClass}`}>
            <Button
                className="staking-button"
                onClick={() => {
                    if (ready && amountToStakeBN) {
                        stake(amountToStakeBN, 'stake');
                    }
                }}
                disabled={!canStake}
            >
                {buttonText}
            </Button>
        </Box>
    );
};

export default StakingBtn;
