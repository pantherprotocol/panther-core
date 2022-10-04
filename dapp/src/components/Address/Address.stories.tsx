import React from 'react';

import {Box, Typography} from '@mui/material';
// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import Jazzicon, {jsNumberForAddress} from 'react-jazzicon';
import {Provider} from 'react-redux';

import {store} from '../../redux/store';
import {formatAccountAddress} from '../../services/account';

import Address from './index';

export default {
    title: 'Address',
    component: Address,
} as Meta;

const dummyAddress = '0xD73879Fd8f0030090cB5cA08Ee87Bc55453EfBd6';

const Template: Story = () => (
    <Provider store={store}>
        <Box className="address-container" data-testid="address-component">
            <Box className="user-avatar">
                <Jazzicon
                    diameter={30}
                    seed={jsNumberForAddress(dummyAddress)}
                    data-testid="jazz-icon"
                />
            </Box>
            <Typography
                className="account-address"
                data-testid="wallet-address-test-id"
            >
                {formatAccountAddress(dummyAddress)}
            </Typography>
        </Box>
    </Provider>
);

export const Default = Template.bind({});
