import React from 'react';

import {Box} from '@mui/material';

import Address from '../../Address';

import './styles.scss';

export default function AddressWithSetting() {
    return (
        <Box className="address-with-setting">
            <Box className="address">
                <Address />
            </Box>
            {/*<Box className="setting-icon">
                <Tooltip title="Settings" placement="top">
                    <IconButton>
                        <img src={settingIcon} />
                    </IconButton>
                </Tooltip>
            </Box>*/}
        </Box>
    );
}
