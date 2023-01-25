// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {useWeb3React} from '@web3-react/core';
import addressLogo from 'images/address-logo.svg';
import {formatAccountAddress} from 'lib/format';
import {currentNetwork} from 'services/connectors';

import './styles.scss';

const Address = () => {
    const context = useWeb3React();
    const {chainId} = context;
    const network = currentNetwork(chainId);

    const {account} = context;

    return (
        (account && (
            <Box className="address-container" data-testid="address-component">
                <Box className="user-avatar">
                    {network && <img src={addressLogo} alt="address logo" />}
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
