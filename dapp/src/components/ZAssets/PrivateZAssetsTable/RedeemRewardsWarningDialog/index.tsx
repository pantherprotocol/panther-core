import * as React from 'react';
import {ChangeEvent, useEffect, useState} from 'react';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    Checkbox,
} from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import {useWeb3React} from '@web3-react/core';
import moment from 'moment';

import {parseTxErrorMessage} from '../../../../lib/errors';
import {awaitConfirmationAndRetrieveEvent} from '../../../../lib/events';
import {useAppDispatch} from '../../../../redux/hooks';
import {
    updateExitCommitmentTime,
    updateUTXOStatus,
} from '../../../../redux/slices/advancedStakesRewards';
import {removeBlur, setBlur} from '../../../../redux/slices/blur';
import {
    progressToNewWalletAction,
    registerWalletActionFailure,
    registerWalletActionSuccess,
    startWalletAction,
    StartWalletActionPayload,
} from '../../../../redux/slices/web3WalletLastAction';
import {getExitDelay} from '../../../../services/env';
import {deriveRootKeypairs} from '../../../../services/keychain';
import {exit} from '../../../../services/pool';
import {isDetailedError} from '../../../../types/error';
import {AdvancedStakeRewards, UTXOStatus} from '../../../../types/staking';
import BackButton from '../../../BackButton';
import {notifyError} from '../../../Common/errors';
import {
    openNotification,
    removeNotification,
} from '../../../Common/notification';
import PrimaryActionButton from '../../../Common/PrimaryActionButton';

import './styles.scss';

export default function RedeemRewardsWarningDialog(props: {
    handleClose: () => void;
    rewards: AdvancedStakeRewards;
}) {
    const {handleClose, rewards} = props;
    const exitCommitmentTime = rewards.exitCommitmentTime;

    const dispatch = useAppDispatch();
    const context = useWeb3React();
    const {account, chainId, library} = context;
    const exitDelay = getExitDelay()!;

    const [redemptionConfirmed, setRedeemConfirmed] = useState(false);

    const isLockPeriodPassed =
        exitCommitmentTime &&
        exitCommitmentTime + parseInt(exitDelay) < moment().unix();

    const exitCommitmentTimeMs =
        exitCommitmentTime && (exitCommitmentTime + parseInt(exitDelay)) * 1000;

    const closeModalAndRedeem = () => {
        handleClose();
        redeem();
    };

    const redeem = React.useCallback(async () => {
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
            'Your withdrawal transaction is currently in progress. Please wait for confirmation!',
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
            'Congratulations! Your withdrawal transaction was processed!',
            'info',
            10000,
        );
    }, [dispatch, library, account, chainId, rewards]);

    const toggleConfirmationCheckbox = (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        setRedeemConfirmed(event.target.checked);
    };

    const registerExitCommitment = () => {
        dispatch(updateExitCommitmentTime, [
            chainId,
            account,
            rewards.id,
            moment().unix(),
        ]);
    };

    useEffect((): (() => any) => {
        dispatch(setBlur);
        return () => dispatch(removeBlur);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Dialog
            className="modal-dialog redeem-dialog"
            onClose={handleClose}
            open={true}
        >
            <BackButton onClick={handleClose} />
            <DialogTitle>
                <Typography className="modal-dialog-title">
                    Early ZKP Redemption
                </Typography>
            </DialogTitle>

            <DialogContent className="modal-dialog-content-holder">
                <Box
                    component="div"
                    className="modal-dialog-content"
                    display="inline"
                >
                    <Box display="inline" className="content-body">
                        As an Advanced Staking user, you're qualified to
                        receive:
                        <ol>
                            <li>
                                Staking rewards (zZKP in the MASP)
                                <br />
                                that accumulate PRPs - accrued PRPs.
                            </li>
                            <li>
                                10k Panther Reward Points
                                <br />
                                that will become redeemable for zZKP upon
                                launch.
                            </li>
                        </ol>
                        <Box>
                            <Typography className="warning" display="inline">
                                WARNING!
                            </Typography>{' '}
                            By redeeming before our v1 launch, you will still be
                            able to claim 10k PRPs after the launch but{' '}
                            <strong>
                                will lose all additional accrued rewards
                            </strong>{' '}
                            (see point 1).
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <Box>
                <FormGroup className="confirm-redemption-checkbox">
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={redemptionConfirmed}
                                onChange={toggleConfirmationCheckbox}
                            />
                        }
                        label={
                            <Typography>
                                I understand I will lose additional{' '}
                                <strong> accrued </strong> PRP rewards
                            </Typography>
                        }
                    />
                </FormGroup>
            </Box>

            <DialogActions>
                <Box className={`redeem-action-holder`}>
                    {exitCommitmentTime ? (
                        <PrimaryActionButton
                            onClick={closeModalAndRedeem}
                            disabled={!isLockPeriodPassed}
                        >
                            {isLockPeriodPassed ? (
                                <Typography>
                                    Redeem zZKP and forfeit additional{' '}
                                    <strong>accrued</strong> PRP rewards
                                </Typography>
                            ) : (
                                <Typography>
                                    Redeeming will be allowed{' '}
                                    {moment().to(exitCommitmentTimeMs)}
                                </Typography>
                            )}
                        </PrimaryActionButton>
                    ) : (
                        <PrimaryActionButton
                            onClick={registerExitCommitment}
                            disabled={!redemptionConfirmed}
                        >
                            Register Commitment
                        </PrimaryActionButton>
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
}
