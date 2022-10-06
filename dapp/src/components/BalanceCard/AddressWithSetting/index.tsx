import React from 'react';

import {Box, Tooltip} from '@mui/material';
import CopyToClipboard from 'react-copy-to-clipboard';

import copyIcon from '../../../images/copy-icon.svg';
import Address from '../../Address';

import './styles.scss';

export default function AddressWithSetting(props: {account: string}) {
    return (
        <Box className="address-with-setting">
            <Box className="address">
                <Address />
            </Box>
            <Tooltip title="Copy Wallet Address" placement="top">
                <span className="copy-icon-wrapper">
                    <CopyToClipboard text={props.account}>
                        <img src={copyIcon} alt="copy-icon" />
                    </CopyToClipboard>
                </span>
            </Tooltip>
        </Box>
    );
}
