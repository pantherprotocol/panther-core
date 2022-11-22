import React, {useState, ChangeEvent} from 'react';

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
import {useWeb3React} from '@web3-react/core';
import BackButton from 'components/BackButton';
import {notifyError} from 'components/Common/errors';
import {MessageWithTx} from 'components/Common/MessageWithTx';
import {openNotification} from 'components/Common/notification';
import PrimaryActionButton from 'components/Common/PrimaryActionButton';
import {formatDuration, getUnixTime} from 'date-fns';
import {CONFIRMATIONS_NUM} from 'lib/constants';
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
} from 'redux/slices/wallet/advanced-stakes-rewards';
import {poolV0ExitDelaySelector} from 'redux/slices/wallet/poolV0';
import {parseTxErrorMessage} from 'services/errors';
import {generateRootKeypairs} from 'services/keys';
import {registerCommitToExit} from 'services/pool';
import {isDetailedError} from 'types/error';
import {AdvancedStakeRewards, UTXOStatus} from 'types/staking';

export default function FirstStageRedeem(props: {
    handleClose: () => void;
    reward: AdvancedStakeRewards;
}) {
    const {handleClose, reward} = props;
    const [redemptionConfirmed, setRedeemConfirmed] = useState(false);

    const dispatch = useAppDispatch();
    const context = useWeb3React();
    const {account, chainId, library} = context;

    const walletActionCause = useAppSelector(walletActionCauseSelector);
    const walletActionStatus = useAppSelector(walletActionStatusSelector);
    const exitDelay = useAppSelector(poolV0ExitDelaySelector);

    const delayTimeFormatted =
        exitDelay &&
        formatDuration({
            seconds: exitDelay,
        });

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
        if (keys instanceof Error) {
            dispatch(registerWalletActionFailure, 'signMessage');
            return notifyError({
                message: 'Panther wallet error',
                details: `Failed to generate Panther wallet secrets from signature: ${keys.message}`,
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

        let tx;
        let status: UTXOStatus;
        try {
            [tx, status] = await registerCommitToExit(
                library,
                account as string,
                chainId as number,
                reward.utxoData,
                BigInt(reward.id),
                keys,
            );
        } catch (err) {
            dispatch(registerWalletActionFailure, 'registerCommitToExit');
            return openNotification(
                'Transaction error',
                parseTxErrorMessage(err),
                'danger',
            );
        }

        if (isDetailedError(tx)) {
            dispatch(updateUTXOStatus, [chainId, account, reward.id, status]);
            dispatch(registerWalletActionFailure, 'registerCommitToExit');
            return notifyError(tx);
        }

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
            getUnixTime(new Date()),
        ]);

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
                                Using Early Redemption now will forfeit the{' '}
                                <br /> portion of PRP rewards that is accrued
                                due to your zZKP
                                <br /> balance in the pool which will be
                                calculated and issued only at launch of CoreV1.
                            </Typography>
                            <Typography className="text semi-bold-text">
                                Early redemption will take {delayTimeFormatted}{' '}
                                to initiate before you
                                <br /> are able to redeem your ZKP.
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
                <Box className={`redeem-action-holder`}>
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
