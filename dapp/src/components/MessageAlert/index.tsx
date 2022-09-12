import React from 'react';

import {Box, Typography} from '@mui/material';

import xIcon from '../../images/x-icon.svg';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {
    acknowledgedNotificationSelector,
    acknowledgeNotification,
} from '../../redux/slices/acknowledgedNotifications';

import './styles.scss';

interface alertType {
    title: string;
    body: string;
    notificationOwner: string;
}

const MessageAlert = (props: alertType) => {
    const acknowledgedNotification = useAppSelector(
        acknowledgedNotificationSelector(props.notificationOwner),
    );

    const dispatch = useAppDispatch();

    return (
        <>
            {!acknowledgedNotification && (
                <Box className="message-alert-container">
                    <Box className="alert-box"></Box>
                    <Box className="content-box">
                        <img
                            src={xIcon}
                            alt="close"
                            className="close-icon"
                            onClick={() =>
                                dispatch(
                                    acknowledgeNotification,
                                    props.notificationOwner,
                                )
                            }
                        />
                        <Box className="text-box">
                            <Typography className="title">
                                {props.title}
                            </Typography>
                            <Typography className="body">
                                {props.body}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}
        </>
    );
};

export default MessageAlert;
