import React from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {Box, Tooltip} from '@mui/material';
import CopyToClipboard from 'react-copy-to-clipboard';

import Address from '../../Address';

import './styles.scss';

export default function AddressWithSetting(props: {account: string}) {
    return (
        <Box className="address-with-setting">
            <Box className="address">
                <Address />
            </Box>
            <Tooltip title="Copy Wallet Address" placement="top">
                <span>
                    <CopyToClipboard text={props.account}>
                        <ContentCopyIcon className="content-copy-icon" />
                    </CopyToClipboard>
                </span>
            </Tooltip>
        </Box>
    );
}
