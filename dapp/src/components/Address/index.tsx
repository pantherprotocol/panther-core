import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {useWeb3React} from '@web3-react/core';
import Jazzicon, {jsNumberForAddress} from 'react-jazzicon';

import {formatAccountAddress} from '../../lib/format';

import './styles.scss';

const Address = () => {
    const context = useWeb3React();
    const {account} = context;

    return (
        (account && (
            <Box className="address-container" data-testid="address-component">
                <Box className="user-avatar">
                    <Jazzicon
                        diameter={30}
                        seed={jsNumberForAddress(account)}
                        data-testid="jazz-icon"
                    />
                </Box>
                <Typography
                    className="account-address"
                    data-testid="wallet-address-test-id"
                >
                    {formatAccountAddress(account)}
                </Typography>
            </Box>
        )) ||
        null
    );
};
export default Address;
