import React, {useEffect, ReactElement} from 'react';

import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import xIcon from 'images/x-icon.svg';
import {useAppDispatch, useAppSelector} from 'redux/hooks';
import {removeBlur, setBlur} from 'redux/slices/ui/blur';
import {
    acknowledgeByUser,
    walletActionCauseSelector,
    WalletSignatureTrigger,
} from 'redux/slices/ui/web3WalletLastAction';

import './styles.scss';

const getText = (
    trigger: WalletSignatureTrigger | undefined,
): [string, ReactElement] => {
    switch (trigger) {
        case 'undefined UTXOs':
            return [
                'Scanning Panther wallet',
                <span key={trigger}>
                    New zAssets have been found in your wallet. Please sign the
                    message to derive your Panther wallet keys, which will then
                    be used to scan the blockchain for the latest data about
                    your zAssets.
                </span>,
            ];
        case 'register exit commitment':
            return [
                'Register Your Commitment',
                <span key={trigger}>
                    To register your commitment, please sign the message to
                    derive your Panther wallet keys, which will then be used to
                    generate the reading and spending keys allowing this reward
                    UTXO to be claimed.
                </span>,
            ];
        case 'zZKP redemption':
            return [
                'Redeeming zZKP',
                <span key={trigger}>
                    To redeem your zZKP reward, please sign the message to
                    derive your Panther wallet keys, which will then be used to
                    generate the reading and spending keys allowing this reward
                    UTXO to be claimed.
                </span>,
            ];
        case 'manual refresh':
        default:
            return [
                'Refreshing Panther wallet',
                <span key={trigger || 'default'}>
                    To refresh your wallet, please sign the message to derive
                    your Panther wallet keys, which will then be used to scan
                    the blockchain for the latest data about your zAssets.
                </span>,
            ];
    }
};

const SignatureRequestModal = () => {
    const dispatch = useAppDispatch();
    const cause = useAppSelector(walletActionCauseSelector);

    const handleClose = () => {
        dispatch(removeBlur);
        dispatch(acknowledgeByUser, 'signMessage');
    };

    useEffect((): (() => void) => {
        dispatch(setBlur);
        return () => dispatch(removeBlur);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [title, text] = getText(cause?.trigger);

    return (
        <Dialog
            className="modal-dialog signature-request"
            open={true}
            data-testid="signature-request-modal_signature-request-modal_container"
        >
            <Box
                onClick={handleClose}
                className="x-icon"
                data-testid="signature-request-modal_signature-request-modal_close-icon"
            >
                <Tooltip title={'Click to close Dialog box'} placement="top">
                    <IconButton>
                        <img src={xIcon} />
                    </IconButton>
                </Tooltip>
            </Box>

            <DialogTitle>
                <Typography className="modal-dialog-title">{title}</Typography>
            </DialogTitle>

            <DialogContent className="modal-dialog-content-holder">
                <Typography
                    component="div"
                    className="modal-dialog-content"
                    display="inline"
                >
                    <Box display="inline">{text}</Box>
                    <Box className="more-info">
                        This signature is totally free and does not spend any
                        gas.
                    </Box>
                </Typography>
            </DialogContent>
        </Dialog>
    );
};

export default SignatureRequestModal;
