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

import networkLogo from '../../../images/polygon-white-logo.svg';
import xIcon from '../../../images/x-icon.svg';
import {useAppDispatch} from '../../../redux/hooks';
import {removeBlur, setBlur} from '../../../redux/slices/ui/blur';
import {supportedNetworks} from '../../../services/connectors';
import {MASP_CHAIN_ID} from '../../../services/env';
import {switchNetwork} from '../../../services/wallet';
import PrimaryActionButton from '../../Common/PrimaryActionButton';

import './styles.scss';

const ZAssetSwitchModal = ({
    open,
    closeHandler,
}: {
    open: boolean;
    closeHandler: () => void;
}) => {
    const dispatch = useAppDispatch();

    const handleClose = () => {
        dispatch(removeBlur);
        closeHandler();
    };

    const switchHandler = async (chainId: number) => {
        await switchNetwork(chainId);
        handleClose();
    };

    useEffect((): (() => void) => {
        open && dispatch(setBlur);
        return () => dispatch(removeBlur);
    }, [dispatch, open]);

    return (
        <Dialog
            className="modal-dialog zassets-modal"
            open={Boolean(open)}
            data-testid="zassets-switch-network-modal"
        >
            <Box className="x-icon">
                <Tooltip title={'Click to close Dialog box'} placement="top">
                    <IconButton
                        onClick={handleClose}
                        data-testid="assets-switch-network-modal-close-button"
                    >
                        <img src={xIcon} />
                    </IconButton>
                </Tooltip>
            </Box>

            <DialogTitle className="modal-text-wrapper">
                <Typography className="modal-dialog-title">
                    Switch to Supported Network
                </Typography>
                <Typography className="modal-dialog-subtitle">
                    To view your zAsset balance, switch to a supported network.
                </Typography>
            </DialogTitle>

            <DialogContent className="modal-dialog-content-holder">
                <Box className="modal-dialog-content">
                    <PrimaryActionButton
                        onClick={() => switchHandler(MASP_CHAIN_ID!)}
                    >
                        <>
                            <Typography className="network-name">
                                {supportedNetworks[MASP_CHAIN_ID!]?.name}
                            </Typography>
                            <div className="network-logo-wrapper">
                                <img
                                    className="network-logo"
                                    src={networkLogo}
                                ></img>
                            </div>
                        </>
                    </PrimaryActionButton>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default ZAssetSwitchModal;
