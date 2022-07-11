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
} from '../../redux/slices/web3WalletLastAction';

import './styles.scss';

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
                <Typography className="modal-dialog-title">
                    Scanning Panther wallet
                </Typography>
            </DialogTitle>

            <DialogContent className="modal-dialog-content-holder">
                <Typography
                    component="div"
                    className="modal-dialog-content"
                    display="inline"
                >
                    <Box display="inline">
                        {cause?.trigger == 'undefined UTXOs'
                            ? 'New zAssets have been found in your wallet. Please '
                            : 'To refresh your wallet, please '}
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
