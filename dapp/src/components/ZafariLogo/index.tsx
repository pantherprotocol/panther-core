import React from 'react';

import {Box} from '@mui/material';

import zafariLogo from '../../images/zafari-logo.png';

import './styles.scss';

function ZafariLogo() {
    return (
        <Box className="zafari-logo">
            <img src={zafariLogo} />
        </Box>
    );
}

export default ZafariLogo;
