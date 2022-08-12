import React from 'react';

import {Box, Typography} from '@mui/material';

import xIcon from '../../images/x-icon.svg';

import './styles.scss';

interface alertType {
    handleClose: () => void;
    title: string;
    body: string;
}

const MessageAlert = (props: alertType) => {
    return (
        <Box className="message-alert-container">
            <Box className="alert-box"></Box>
            <Box className="content-box">
                <img
                    src={xIcon}
                    alt="close"
                    className="close-icon"
                    onClick={props.handleClose}
                />
                <Box className="text-box">
                    <Typography className="title">{props.title}</Typography>
                    <Typography className="body">{props.body}</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default MessageAlert;
