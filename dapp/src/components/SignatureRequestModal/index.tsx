import React, {useEffect} from 'react';

import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';

import xIcon from '../../images/x-icon.svg';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {removeBlur, setBlur} from '../../redux/slices/blur';
import {
    acknowledgeByUser,
    walletActionCauseSelector,
    WalletSignatureTrigger,
} from '../../redux/slices/web3WalletLastAction';

import './styles.scss';

const getText = (
    trigger: WalletSignatureTrigger | undefined,
): [string, string] => {
    switch (trigger) {
        case 'undefined UTXOs':
            return [
                'Scanning Panther wallet',
                'New zAssets have been found in your wallet. Please ',
            ];
        case 'zZKP redemption':
            return ['Redeeming zZKP', 'To redeem your zZKP reward, please '];
        case 'manual refresh':
        default:
            return [
                'Refreshing Panther wallet',
                'To refresh your wallet, please ',
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
        <Dialog className="modal-dialog signature-request" open={true}>
            <Box className="x-icon">
                <Tooltip title={'Click to close Dialog box'} placement="top">
                    <IconButton onClick={handleClose}>
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
                    <Box display="inline">
                        {text}
                        sign the message to derive your Panther wallet keys,
                        which will then be used to scan the blockchain for the
                        latest data about your zAssets.
                    </Box>
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
