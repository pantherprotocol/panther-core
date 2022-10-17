import {useCallback} from 'react';
import * as React from 'react';

import {Box, Button} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {BigNumber, utils} from 'ethers';

import {parseTxErrorMessage} from '../../../../src/services/errors';
import {awaitConfirmationAndRetrieveEvent} from '../../../lib/events';
import {formatCurrency} from '../../../lib/format';
import {safeParseUnits} from '../../../lib/numbers';
import {useAppDispatch, useAppSelector} from '../../../redux/hooks';
import {calculatedRewardsSelector} from '../../../redux/slices/advancedStakePredictedRewards';
import {getAdvancedStakesRewardsAndUpdateStatus} from '../../../redux/slices/advancedStakesRewards';
import {getChainBalance} from '../../../redux/slices/chainBalance';
import {getTotalsOfAdvancedStakes} from '../../../redux/slices/totalsOfAdvancedStakes';
import {getTotalUnclaimedClassicRewards} from '../../../redux/slices/totalUnclaimedClassicRewards';
import {
    startWalletAction,
    StartWalletActionPayload,
    registerWalletActionFailure,
    progressToNewWalletAction,
    registerWalletActionSuccess,
    WalletActionTrigger,
    walletActionCauseSelector,
    walletActionStatusSelector,
} from '../../../redux/slices/web3WalletLastAction';
import {getZkpStakedBalance} from '../../../redux/slices/zkpStakedBalance';
import {getZkpTokenBalance} from '../../../redux/slices/zkpTokenBalance';
import {chainHasAdvancedStaking} from '../../../services/contracts';
import {generateRootKeypairs} from '../../../services/keys';
import {advancedStake} from '../../../services/staking';
import {StakingRewardTokenID} from '../../../types/staking';
import {notifyError} from '../../Common/errors';
import {MessageWithTx} from '../../Common/MessageWithTx';
import {openNotification, removeNotification} from '../../Common/notification';

import './styles.scss';

const getButtonText = (
    amount: string | null,
    amountBN: BigNumber | null,
    minStake: number | null,
    tokenBalance: BigNumber | null,
    zZkpBN: BigNumber | null | undefined,
): [string, boolean] => {
    if (minStake === null) {
        return ["Couldn't get minimum stake", false];
    }
    if (!tokenBalance) {
        return ["Couldn't get token balance", false];
    }
    if (!amount || !amountBN) {
        return ['Enter amount of ZKP to stake above', false];
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
        if (!zZkpBN || zZkpBN.lt(utils.parseEther('0.01'))) {
            console.debug(
                `Insufficient zZKP rewards to stake: ${utils.formatEther(
                    zZkpBN!,
                )} <0.01`,
            );

            return ['Insufficient zZKP rewards to stake', false];
        }

        console.debug(
            'Sufficient ZKP balance:',
            utils.formatEther(amountBN),
            amountBN.eq(tokenBalance) ? '==' : '<=',
            utils.formatEther(tokenBalance),
        );
        // We display amount rather than stringifying amountBN, because we want
        // to make sure we display the same amount which is visible in the
        // staking amount field, and this is not guaranteed to be the same
        // due to rounding discrepancies, e.g. if Max button is clicked.
        return [
            `STAKE ${amountBN ? formatCurrency(amountBN) : '0.00'} ZKP`,
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

    const {
        amountToStake,

        minStake,
        tokenBalance,
    } = props;

    const rewards = useAppSelector(calculatedRewardsSelector);
    const zZkpBN = rewards?.[StakingRewardTokenID.zZKP];

    const [buttonText, ready] = getButtonText(
        amountToStake,
        amountToStakeBN,
        minStake,
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

            if (keys instanceof Error) {
                dispatch(registerWalletActionFailure, 'signMessage');
                notifyError({
                    message: 'Failed to create stake',
                    details: keys.message,
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
                    message: 'Error during stake',
                    details: 'Advanced staking is not supported on this chain',
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

            if (response instanceof Error) {
                dispatch(registerWalletActionFailure, 'stake');
                openNotification(
                    'Transaction error',
                    parseTxErrorMessage(response),
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

            if (event instanceof Error) {
                dispatch(registerWalletActionFailure, 'stake');

                openNotification(
                    'Transaction error',
                    <MessageWithTx
                        message={parseTxErrorMessage(event)}
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
            dispatch(getTotalsOfAdvancedStakes, context);
            dispatch(getZkpStakedBalance, context);
            dispatch(getZkpTokenBalance, context);
            dispatch(getTotalUnclaimedClassicRewards, context);
            dispatch(getChainBalance, context);
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
