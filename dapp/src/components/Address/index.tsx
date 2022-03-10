import React from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {Tooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {useWeb3React} from '@web3-react/core';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import Jazzicon, {jsNumberForAddress} from 'react-jazzicon';

import {formatAccountAddress} from '../../services/account';

import './styles.scss';

const Address = () => {
    const context = useWeb3React();
    const {account} = context;

    return (
        (account && (
            <Box className="address-container">
                <Box className="user-avatar">
                    <Jazzicon
                        diameter={30}
                        seed={jsNumberForAddress(account)}
                    />
                </Box>
                <Typography className="account-address">
                    {formatAccountAddress(account)}
                </Typography>
                <Tooltip title="Copy Wallet Address" placement="top">
                    <span>
                        <CopyToClipboard text={account}>
                            <ContentCopyIcon className="content-copy-icon" />
                        </CopyToClipboard>
                    </span>
                </Tooltip>
            </Box>
        )) ||
        null
    );
};
export default Address;
