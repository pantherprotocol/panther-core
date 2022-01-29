import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {useWeb3React} from '@web3-react/core';
import {Tooltip} from '@mui/material';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import './styles.scss';

const Address = (props: {
    accountAvatar: string;
    accountAddress: string | null;
}) => {
    const context = useWeb3React();
    const {account} = context;

    return (
        <Box
            display="flex"
            alignItems="center"
            justifyContent="space-around"
            width={'100%'}
        >
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                width={'24px'}
                marginLeft={'18px'}
            >
                <img src={props.accountAvatar} alt={'User avatar'} />
            </Box>
            <Typography
                sx={{
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '42px',
                    marginLeft: '18px',
                    marginRight: '18px',
                }}
            >
                {props.accountAddress}
            </Typography>
            <Tooltip title="Copy Wallet Address" placement="top">
                <span>
                    <CopyToClipboard text={account}>
                        <ContentCopyIcon
                            sx={{
                                opacity: 0.5,
                                width: '0.8em',
                                height: '0.8em',
                                marginRight: '18px',
                                cursor: 'pointer',
                            }}
                        />
                    </CopyToClipboard>
                </span>
            </Tooltip>
        </Box>
    );
};
export default Address;
