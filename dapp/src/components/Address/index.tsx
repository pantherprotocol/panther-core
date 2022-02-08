import React from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {Tooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {useWeb3React} from '@web3-react/core';
import {CopyToClipboard} from 'react-copy-to-clipboard';

import './styles.scss';

const Address = (props: {
    accountAvatar: string;
    accountAddress: string | null;
}) => {
    const context = useWeb3React();
    const {account} = context;

    return (
        <Box className="address-container">
            <Box className="user-avatar">
                <img src={props.accountAvatar} alt={'User avatar'} />
            </Box>
            <Typography className="account-address">
                {props.accountAddress}
            </Typography>
            <Tooltip title="Copy Wallet Address" placement="top">
                <span>
                    <CopyToClipboard text={account}>
                        <ContentCopyIcon className="content-copy-icon" />
                    </CopyToClipboard>
                </span>
            </Tooltip>
        </Box>
    );
};
export default Address;
