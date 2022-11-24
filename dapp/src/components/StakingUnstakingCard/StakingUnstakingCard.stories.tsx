// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Web3ReactProvider} from '@web3-react/core';
import {Provider} from 'react-redux';
import {MemoryRouter} from 'react-router-dom';
import {store} from 'redux/store';
import {getLibrary} from 'services/provider';

import StakingUnstakingCard from './index';

export default {
    title: 'StakingUnstakingCard',
    component: StakingUnstakingCard,
} as Meta;

const Template: Story = () => (
    <Provider store={store}>
        <Web3ReactProvider getLibrary={getLibrary}>
            <MemoryRouter>
                <StakingUnstakingCard />
            </MemoryRouter>
        </Web3ReactProvider>
    </Provider>
);

export const Default = Template.bind({});
