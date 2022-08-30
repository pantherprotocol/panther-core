import React from 'react';

import {Box, IconButton, Typography} from '@mui/material';

import backButtonLeftArrow from '../../images/back-button-left-arrow.svg';

import './styles.scss';

function BackButton(props: {onClick: () => any}) {
    return (
        <Box className="back-button-holder">
            <IconButton className="back-button" onClick={props.onClick}>
                <img src={backButtonLeftArrow} />
                <Typography id="caption">Back</Typography>
            </IconButton>
        </Box>
    );
}

export default BackButton;
