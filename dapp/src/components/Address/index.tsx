// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {useWeb3React} from '@web3-react/core';
import {networkLogo} from 'components/common/NetworkLogo';
import useScreenSize from 'hooks/screen';
import {formatAccountAddress} from 'lib/format';
import Jazzicon, {jsNumberForAddress} from 'react-jazzicon';
import {currentNetwork} from 'services/connectors';

import './styles.scss';

const Address = () => {
    const {isNormal} = useScreenSize();
    const context = useWeb3React();
    const {chainId} = context;
    const network = currentNetwork(chainId);

    const {account} = context;

    return (
        (account && (
            <Box className="address-container" data-testid="address-component">
                <Box className="user-avatar">
                    {isNormal ? (
                        <Jazzicon
                            diameter={30}
                            seed={jsNumberForAddress(account)}
                            data-testid="jazz-icon"
                        />
                    ) : (
                        network && (
                            <img
                                src={networkLogo(network.symbol)}
                                alt="panter logo"
                            />
                        )
                    )}
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
