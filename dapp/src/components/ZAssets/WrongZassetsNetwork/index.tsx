import React, {useState} from 'react';

import {Box, Divider, Typography} from '@mui/material';

import warningIcon from '../../../images/warning-icon.svg';
import PrimaryActionButton from '../../Common/PrimaryActionButton';
import ZAssetSwitchModal from '../ZAssetSwitchModal';

import './styles.scss';

export default function WrongZAssetsNetwork() {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    return (
        <Box className="wrong-network-container">
            <Box className="wrong-network-box"></Box>
            <Box className="content">
                <ZAssetSwitchModal
                    open={isOpen}
                    closeHandler={() => setIsOpen(false)}
                />
                <Box className="info-box">
                    <img className="img" src={warningIcon} alt="warning icon" />
                    <Divider className="divider" />
                    <Box className="text-wrapper">
                        <Typography className="text">
                            Unsupported Network
                        </Typography>
                        <Typography className="text sub-text">
                            You are currently connected to a network that does
                            not support zAssets. <br />
                            Switch to Mumbai to view your balance.
                        </Typography>
                    </Box>
                </Box>
                <Box className="switch-btn">
                    <PrimaryActionButton onClick={setIsOpen}>
                        Switch Network
                    </PrimaryActionButton>
                </Box>
            </Box>
        </Box>
    );
}
