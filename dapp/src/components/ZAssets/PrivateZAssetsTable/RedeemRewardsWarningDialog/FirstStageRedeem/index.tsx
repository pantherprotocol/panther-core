// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useState, ChangeEvent} from 'react';

import {CONFIRMATIONS_NUM} from 'constants/contract-confirmations';

import {
    Box,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    FormGroup,
    Typography,
} from '@mui/material';
import * as Sentry from '@sentry/browser';
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
import {ContractTransaction} from 'ethers/lib/ethers';
import {useAppDispatch, useAppSelector} from 'redux/hooks';
import {
    progressToNewWalletAction,
    registerWalletActionFailure,
    registerWalletActionSuccess,
    startWalletAction,
    StartWalletActionPayload,
    walletActionCauseSelector,
    walletActionStatusSelector,
} from 'redux/slices/ui/web3-wallet-last-action';
import {
    updateExitCommitmentTime,
    updateUTXOStatus,
} from 'redux/slices/wallet/utxos';
import {MultiError, parseTxErrorMessage} from 'services/errors';
import {generateRootKeypairs} from 'services/keys';
import {registerCommitToExit} from 'services/pool';
import {UTXO, UTXOStatus} from 'types/utxo';

export default function FirstStageRedeem(props: {
    handleClose: () => void;
    reward: UTXO;
}) {
    const {handleClose, reward} = props;
    const [redemptionConfirmed, setRedeemConfirmed] = useState(false);

    const dispatch = useAppDispatch();
    const context = useWeb3React();
    const {account, chainId, library} = context;

    const walletActionCause = useAppSelector(walletActionCauseSelector);
    const walletActionStatus = useAppSelector(walletActionStatusSelector);

    const toggleConfirmationCheckbox = (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        setRedeemConfirmed(event.target.checked);
    };

    const registerCommitmentInProgress =
        walletActionCause?.trigger === 'register exit commitment' &&
        walletActionStatus === 'in progress';

    const registerExitCommitment = async () => {
        const trigger = 'register exit commitment';
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
            return notifyError({
                errorLabel: 'Panther wallet error',
                message: `Failed to generate Panther wallet secrets from signature: ${keys.message}`,
                triggerError: keys,
            });
        }
        dispatch(progressToNewWalletAction, {
            oldAction: 'signMessage',
            newAction: {
                name: 'registerCommitToExit',
                cause: {caller: 'PrivateBalance', trigger},
                data: {account, caller: 'redeem button'},
            },
        });
        handleClose();

        let tx: ContractTransaction | MultiError | null;
        let status: UTXOStatus;
        try {
            [tx, status] = await registerCommitToExit(
                library,
                account as string,
                chainId as number,
                reward.data,
                BigInt(reward.id),
                keys,
            );
        } catch (err) {
            dispatch(registerWalletActionFailure, 'registerCommitToExit');
            Sentry.captureException(err);
            return openNotification(
                'Transaction error',
                parseTxErrorMessage(err),
                'danger',
            );
        }

        if (tx instanceof MultiError) {
            dispatch(updateUTXOStatus, [chainId, account, reward.id, status]);
            dispatch(registerWalletActionFailure, 'registerCommitToExit');
            if (tx.isUserRejectedError) return;
            return notifyError(tx);
        }

        const inProgress = openNotification(
            'Registration in progress',
            <MessageWithTx
                message="Your commitment transaction is currently in progress. Please wait for confirmation!"
                chainId={chainId}
                txHash={tx?.hash}
            />,

            'info',
        );

        // null is returned when there was no actual transaction and commitment
        // was registered before. See Error PP:E32 in poolContractCommitToExit()
        if (tx !== null) {
            await tx.wait(CONFIRMATIONS_NUM);
        }

        dispatch(registerWalletActionSuccess, 'registerCommitToExit');
        dispatch(updateExitCommitmentTime, [
            chainId,
            account,
            reward.id,
            dayjs().unix(),
        ]);

        removeNotification(inProgress);

        openNotification(
            'Registration completed successfully',
            <MessageWithTx
                message="Congratulations! You registered successfully commitment transaction!"
                txHash={tx?.hash}
                chainId={chainId}
            />,

            'info',
            10000,
        );
    };

    return (
        <Dialog
            className="modal-dialog redeem-dialog"
            onClose={handleClose}
            open={true}
        >
            <BackButton onClick={handleClose} />
            <DialogTitle>
                <Typography className="modal-dialog-title redeem-dialog-title">
                    1. Early zZKP Redemption
                </Typography>
            </DialogTitle>

            <DialogContent className="modal-dialog-content-holder">
                <Box
                    component="div"
                    className="modal-dialog-content"
                    display="inline"
                >
                    <Box display="inline" className="content-body">
                        <Box>
                            <Typography className="text">
                                <span className="semi-bold-text">WARNING!</span>{' '}
                                Using Early Redemption now will forfeit
                                “unrealized” PRP rewards to be accrued due to
                                your zAsset (i.e., zZKP) kept in the Multi-Asset
                                Shielded Pool. To “realize” (i.e., to receive)
                                these rewards, you need to keep your zZKP in the
                                Pool till the CoreV1 launch.
                            </Typography>
                            <Typography className="text semi-bold-text">
                                Early redemption will take 24 hours to initiate
                                before you are able to redeem your ZKP.
                            </Typography>
                            <Typography className="text">
                                Read more about early zZKP redemption in
                                <a
                                    className="blog-link"
                                    target="_blank"
                                    rel="noreferrer"
                                    href="https://blog.pantherprotocol.io/"
                                >
                                    our blog post.
                                </a>
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <Box className="data-info-box">
                <FormGroup className="confirm-redemption-checkbox">
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={redemptionConfirmed}
                                onChange={toggleConfirmationCheckbox}
                            />
                        }
                        label={
                            <Typography className="redemption-label">
                                I understand I will lose a part of my PRP
                                rewards.
                            </Typography>
                        }
                    />
                </FormGroup>
            </Box>

            <DialogActions>
                <Box className="redeem-action-holder">
                    <PrimaryActionButton
                        onClick={registerExitCommitment}
                        disabled={
                            !redemptionConfirmed || registerCommitmentInProgress
                        }
                        styles={`redeem-modal-button ${
                            (!redemptionConfirmed ||
                                registerCommitmentInProgress) &&
                            'disabled'
                        }`}
                    >
                        Redeem zZKP
                    </PrimaryActionButton>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
