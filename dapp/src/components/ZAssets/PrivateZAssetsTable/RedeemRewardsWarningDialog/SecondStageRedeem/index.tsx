import React, {useCallback} from 'react';

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
import {BigNumber} from 'ethers';
import moment from 'moment';

import {parseTxErrorMessage} from '../../../../../lib/errors';
import {awaitConfirmationAndRetrieveEvent} from '../../../../../lib/events';
import {formatCurrency} from '../../../../../lib/format';
import {useAppDispatch, useAppSelector} from '../../../../../redux/hooks';
import {updateUTXOStatus} from '../../../../../redux/slices/advancedStakesRewards';
import {poolV0ExitDelaySelector} from '../../../../../redux/slices/poolV0';
import {
    progressToNewWalletAction,
    registerWalletActionFailure,
    registerWalletActionSuccess,
    startWalletAction,
    StartWalletActionPayload,
} from '../../../../../redux/slices/web3WalletLastAction';
import {deriveRootKeypairs} from '../../../../../services/keychain';
import {exit} from '../../../../../services/pool';
import {isDetailedError} from '../../../../../types/error';
import {AdvancedStakeRewards, UTXOStatus} from '../../../../../types/staking';
import BackButton from '../../../../BackButton';
import {notifyError} from '../../../../Common/errors';
import {MessageWithTx} from '../../../../Common/MessageWithTx';
import {
    openNotification,
    removeNotification,
} from '../../../../Common/notification';
import PrimaryActionButton from '../../../../Common/PrimaryActionButton';

export default function SecondStageRedeem(props: {
    handleClose: () => void;
    rewards: AdvancedStakeRewards;
}) {
    const {handleClose, rewards} = props;

    const dispatch = useAppDispatch();
    const context = useWeb3React();
    const {account, chainId, library} = context;

    const exitDelay = useAppSelector(poolV0ExitDelaySelector);
    const zZKP = formatCurrency(BigNumber.from(props.rewards.zZKP));

    const exitCommitmentTime = rewards.exitCommitmentTime;

    const isLockPeriodPassed =
        exitCommitmentTime &&
        exitDelay &&
        exitCommitmentTime + exitDelay < moment().unix();

    const remainingWaitingTimeFormatted =
        exitCommitmentTime &&
        exitDelay &&
        moment((exitCommitmentTime! + exitDelay!) * 1000).fromNow(true);

    const delayTimeFormatted =
        exitDelay &&
        moment(moment.now() + exitDelay * 1000).from(moment.now(), true);

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
        const keys = await deriveRootKeypairs(signer);
        if (keys instanceof Error) {
            notifyError({
                message: 'Panther wallet error',
                details: `Failed to generate Panther wallet secrets from signature: ${keys.message}`,
                triggerError: keys,
            });
            dispatch(registerWalletActionFailure, 'signMessage');
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
            rewards.utxoData,
            BigInt(rewards.id),
            Number(rewards.creationTime),
            rewards.commitments,
            keys,
        );
        if (isDetailedError(tx)) {
            dispatch(
                utxoStatus == UTXOStatus.UNDEFINED
                    ? registerWalletActionFailure
                    : registerWalletActionSuccess,
                'exit',
            );
            dispatch(updateUTXOStatus, [
                chainId,
                account,
                rewards.id,
                utxoStatus,
            ]);

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

        if (event instanceof Error) {
            dispatch(registerWalletActionSuccess, 'exit');
            dispatch(updateUTXOStatus, [
                chainId,
                account,
                rewards.id,
                UTXOStatus.UNDEFINED,
            ]);

            return notifyError({
                message: 'Transaction error',
                details: `Cannot find event in receipt: ${parseTxErrorMessage(
                    event,
                )}`,
                triggerError: event,
            });
        }
        dispatch(registerWalletActionSuccess, 'exit');
        dispatch(updateUTXOStatus, [
            chainId,
            account,
            rewards.id,
            UTXOStatus.SPENT,
        ]);

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
    }, [dispatch, library, account, chainId, rewards]);

    function progressInPercent(
        exitCommitmentTime: number | undefined,
        exitDelay: number | undefined,
    ): number | undefined {
        const passedTime =
            exitCommitmentTime && moment().unix() - exitCommitmentTime;

        if (passedTime && exitDelay) {
            if (passedTime <= exitDelay) {
                return (passedTime / exitDelay) * 100;
            }

            return 100;
        }

        return 0;
    }

    return (
        <Dialog
            className="modal-dialog redeem-dialog"
            onClose={handleClose}
            open={true}
        >
            <BackButton onClick={handleClose} />
            <DialogTitle>
                <Typography className="modal-dialog-title redeem-dialog-title">
                    2. Early ZKP Redemption
                </Typography>
            </DialogTitle>

            <DialogContent
                className={'modal-dialog-content-holder no-background'}
            >
                <Box
                    component="div"
                    className="modal-dialog-content"
                    display="inline"
                >
                    <Box display="inline" className="content-body">
                        <Typography>
                            You have initiated an early zZKP redemption.
                            Initiation will <br />
                            take {delayTimeFormatted} before you are able to
                            claim your balance.
                        </Typography>
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
                            <span className="label-value">
                                {remainingWaitingTimeFormatted}
                            </span>
                        )}
                    </Typography>
                    <LinearProgress
                        className="redemption-progress"
                        variant="determinate"
                        value={progressInPercent(exitCommitmentTime, exitDelay)}
                    />
                </Box>
            </Box>

            <DialogActions>
                <Box className={`redeem-action-holder`}>
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
                            <p>
                                Claim will be available in{' '}
                                {remainingWaitingTimeFormatted}
                            </p>
                        )}
                    </PrimaryActionButton>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
