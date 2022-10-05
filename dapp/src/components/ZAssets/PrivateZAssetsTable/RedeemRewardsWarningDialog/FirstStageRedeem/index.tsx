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
import {utils} from 'ethers';
import moment from 'moment';

import {parseTxErrorMessage} from '../../../../../lib/errors';
import {formatCurrency} from '../../../../../lib/format';
import {useAppDispatch, useAppSelector} from '../../../../../redux/hooks';
import {updateExitCommitmentTime} from '../../../../../redux/slices/advancedStakesRewards';
import {poolV0ExitDelaySelector} from '../../../../../redux/slices/poolV0';
import {
    progressToNewWalletAction,
    registerWalletActionFailure,
    registerWalletActionSuccess,
    startWalletAction,
    StartWalletActionPayload,
    walletActionCauseSelector,
    walletActionStatusSelector,
} from '../../../../../redux/slices/web3WalletLastAction';
import {deriveRootKeypairs} from '../../../../../services/keychain';
import {registerCommitToExit} from '../../../../../services/pool';
import {isDetailedError} from '../../../../../types/error';
import {AdvancedStakeRewards} from '../../../../../types/staking';
import BackButton from '../../../../BackButton';
import {notifyError} from '../../../../Common/errors';
import {openNotification} from '../../../../Common/notification';
import PrimaryActionButton from '../../../../Common/PrimaryActionButton';

export default function FirstStageRedeem(props: {
    handleClose: () => void;
    rewards: AdvancedStakeRewards;
}) {
    const {handleClose, rewards} = props;
    const [redemptionConfirmed, setRedeemConfirmed] = useState(false);

    const dispatch = useAppDispatch();
    const context = useWeb3React();
    const {account, chainId, library} = context;

    const walletActionCause = useAppSelector(walletActionCauseSelector);
    const walletActionStatus = useAppSelector(walletActionStatusSelector);
    const exitDelay = useAppSelector(poolV0ExitDelaySelector);

    const prp = formatCurrency(utils.parseEther(props.rewards.PRP));

    const delayTimeFormatted =
        exitDelay &&
        moment(moment.now() + exitDelay * 1000).from(moment.now(), true);

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
        const keys = await deriveRootKeypairs(signer);
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
        try {
            tx = await registerCommitToExit(
                library,
                account as string,
                chainId as number,
                rewards.utxoData,
                BigInt(rewards.id),
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
            dispatch(registerWalletActionFailure, 'registerCommitToExit');
            return notifyError(tx);
        }

        dispatch(registerWalletActionSuccess, 'registerCommitToExit');
        dispatch(updateExitCommitmentTime, [
            chainId,
            account,
            rewards.id,
            moment().unix(),
        ]);
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
                    1. Early ZKP Redemption
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
                                If you redeem ZKP before v1.0 of the protocol
                                has launched,
                                <strong>
                                    {' '}
                                    you will forfeit your{' '}
                                    <span className="semi-bold-text">
                                        {prp} PRP
                                    </span>{' '}
                                    staking reward.
                                </strong>
                                You will however, keep your early stake bonus.
                            </Typography>
                            <Typography className="text semi-bold-text">
                                Early redemption will take {delayTimeFormatted}{' '}
                                to initiate before you are able to redeem your
                                ZKP.
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
                                I understand I will lose my eligible staking
                                rewards
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
                        Redeem zZKP and forfeit staking rewards
                    </PrimaryActionButton>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
