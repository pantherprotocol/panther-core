// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useCallback, useEffect, useState} from 'react';

import {
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    Typography,
} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import BackButton from 'components/BackButton';
import {notifyError} from 'components/common/errors';
import {MessageWithTx} from 'components/common/MessageWithTx';
import {
    openNotification,
    removeNotification,
} from 'components/common/notification';
import PrimaryActionButton from 'components/common/PrimaryActionButton';
import dayjs from 'dayjs';
import {BigNumber} from 'ethers';
import {awaitConfirmationAndRetrieveEvent} from 'lib/events';
import {formatCurrency} from 'lib/format';
import {useAppDispatch, useAppSelector} from 'redux/hooks';
import {
    progressToNewWalletAction,
    registerWalletActionFailure,
    registerWalletActionSuccess,
    startWalletAction,
    StartWalletActionPayload,
} from 'redux/slices/ui/web3-wallet-last-action';
import {getChainBalance} from 'redux/slices/wallet/chain-balance';
import {poolV0ExitDelaySelector} from 'redux/slices/wallet/poolV0';
import {updateUTXOStatus} from 'redux/slices/wallet/utxos';
import {getZkpTokenBalance} from 'redux/slices/wallet/zkp-token-balance';
import {MultiError} from 'services/errors';
import {generateRootKeypairs} from 'services/keys';
import {exit} from 'services/pool';
import {UTXO, UTXOStatus} from 'types/utxo';

export default function SecondStageRedeem(props: {
    handleClose: () => void;
    reward: UTXO;
}) {
    const {handleClose, reward} = props;

    const dispatch = useAppDispatch();
    const context = useWeb3React();
    const {account, chainId, library} = context;
    const exitDelay = useAppSelector(poolV0ExitDelaySelector);
    const zZKP = formatCurrency(BigNumber.from(reward.amount));

    const exitCommitmentTime = reward.exitCommitmentTime;
    const now = dayjs();
    const [timeToWait, setTimeToWait] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const [isLockPeriodPassed, setIsLockPeriodPassed] =
        useState<boolean>(false);

    const closeModalAndRedeem = () => {
        handleClose();
        redeem();
    };

    const redeem = useCallback(async () => {
        const trigger = 'zZKP redemption';
        dispatch(startWalletAction, {
            name: 'signMessage',
            cause: {caller: 'RedeemRewards', trigger},
            data: {account},
        } as StartWalletActionPayload);
        const signer = library.getSigner(account);
        const keys = await generateRootKeypairs(signer);
        if (keys instanceof MultiError) {
            dispatch(registerWalletActionFailure, 'signMessage');
            if (keys.isUserRejectedError) return;
            notifyError({
                errorLabel: 'Panther wallet error',
                message: `Failed to generate Panther wallet secrets from signature: ${keys.message}`,
                triggerError: keys,
            });
            return;
        }
        dispatch(progressToNewWalletAction, {
            oldAction: 'signMessage',
            newAction: {
                name: 'exit',
                cause: {caller: 'PrivateBalance', trigger},
                data: {account, caller: 'redeem button'},
            },
        });

        const [utxoStatus, tx] = await exit(
            library,
            account as string,
            chainId as number,
            reward.data,
            BigInt(reward.id),
            reward.creationTime,
            reward.commitment,
            keys,
        );
        if (tx instanceof MultiError) {
            dispatch(
                utxoStatus == UTXOStatus.UNDEFINED
                    ? registerWalletActionFailure
                    : registerWalletActionSuccess,
                'exit',
            );
            dispatch(updateUTXOStatus, [
                chainId,
                account,
                reward.id,
                utxoStatus,
            ]);

            if (tx.isUserRejectedError) return;
            return notifyError(tx);
        }

        const inProgress = openNotification(
            'Transaction in progress',
            <MessageWithTx
                message="Your withdrawal transaction is currently in progress. Please wait for confirmation!"
                chainId={chainId}
                txHash={tx?.hash}
            />,

            'info',
        );

        const event = await awaitConfirmationAndRetrieveEvent(tx, 'Nullifier');
        removeNotification(inProgress);

        if (event instanceof MultiError) {
            dispatch(registerWalletActionSuccess, 'exit');
            dispatch(updateUTXOStatus, [
                chainId,
                account,
                reward.id,
                UTXOStatus.UNDEFINED,
            ]);

            return notifyError({
                errorLabel: 'Transaction error',
                message: `Cannot find event in receipt: ${event.message}`,
                triggerError: event,
            });
        }
        dispatch(registerWalletActionSuccess, 'exit');
        dispatch(updateUTXOStatus, [
            chainId,
            account,
            reward.id,
            UTXOStatus.SPENT,
        ]);
        dispatch(getZkpTokenBalance, context);
        dispatch(getChainBalance, context);

        openNotification(
            'Withdrawal completed successfully',
            <MessageWithTx
                message="Congratulations! Your withdrawal transaction was processed!"
                txHash={tx?.hash}
                chainId={chainId}
            />,

            'info',
            10000,
        );
    }, [dispatch, library, account, chainId, reward, context]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (!(exitCommitmentTime && exitDelay)) {
                return;
            }

            setTimeToWait(
                now.to(dayjs.unix(exitCommitmentTime + exitDelay), true),
            );

            setProgress(
                Math.min((dayjs().unix() - exitCommitmentTime) / exitDelay, 1) *
                    100,
            );
            const isLockPeriodPassed = !!(
                exitCommitmentTime &&
                exitDelay &&
                exitCommitmentTime + exitDelay < dayjs().unix()
            );

            setIsLockPeriodPassed(isLockPeriodPassed);
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, [exitCommitmentTime, exitDelay, now]);

    return (
        <Dialog
            className="modal-dialog redeem-dialog"
            onClose={handleClose}
            open={true}
        >
            <BackButton onClick={handleClose} />
            <DialogTitle>
                <Typography className="modal-dialog-title redeem-dialog-title">
                    2. Early zZKP Redemption
                </Typography>
            </DialogTitle>

            <DialogContent className="modal-dialog-content-holder no-background">
                <Box
                    component="div"
                    className="modal-dialog-content"
                    display="inline"
                >
                    <Box display="inline" className="content-body">
                        {isLockPeriodPassed ? (
                            <Typography>
                                You can redeem now, please check and ensure that
                                your <br />
                                transaction is completed.
                            </Typography>
                        ) : (
                            <Typography>
                                {' '}
                                You have initiated an early zZKP redemption.
                                <br /> Please claim your balance after 24 hours
                            </Typography>
                        )}
                    </Box>
                </Box>
            </DialogContent>
            <Box className="data-info-box">
                <Box className="redemption-progress-holder">
                    <Typography>
                        <span className="label-title">Time Remaining:</span>{' '}
                        {isLockPeriodPassed ? (
                            <span className="label-value">
                                Your balance is ready to redeem!
                            </span>
                        ) : (
                            <span className="label-value">{timeToWait}</span>
                        )}
                    </Typography>
                    <LinearProgress
                        className="redemption-progress"
                        variant="determinate"
                        value={progress}
                    />
                </Box>
            </Box>

            <DialogActions>
                <Box className="redeem-action-holder">
                    <PrimaryActionButton
                        onClick={closeModalAndRedeem}
                        disabled={!isLockPeriodPassed}
                        styles={`redeem-modal-button ${
                            !isLockPeriodPassed && 'disabled'
                        }`}
                    >
                        {isLockPeriodPassed ? (
                            <Typography>Redeem {zZKP} ZKP</Typography>
                        ) : (
                            <p>Claim will be available in {timeToWait}</p>
                        )}
                    </PrimaryActionButton>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
