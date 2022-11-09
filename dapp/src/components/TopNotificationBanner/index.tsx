import React from 'react';

import {Typography} from '@mui/material';

import './styles.scss';

const TopNotificationBanner = (props: {text: string}) => {
    return (
        <Typography className="top-notification-banner ">
            {props.text}
        </Typography>
    );
};

export default TopNotificationBanner;
