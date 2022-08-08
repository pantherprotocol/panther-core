import React from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {useWeb3React} from '@web3-react/core';
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
                <KeyboardArrowDownIcon className="content-copy-icon" />
            </Box>
        )) ||
        null
    );
};
export default Address;
