import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Web3ReactProvider} from '@web3-react/core';
import {Provider} from 'react-redux';
import {MemoryRouter} from 'react-router-dom';
import {store} from 'redux/store';
import {getLibrary} from 'services/provider';

import WalletHeader from './index';

export default {
    title: 'WalletHeader',
    component: WalletHeader,
} as Meta;

const template: Story = () => (
    <Provider store={store}>
        <Web3ReactProvider getLibrary={getLibrary}>
            <MemoryRouter>
                <WalletHeader />
            </MemoryRouter>
        </Web3ReactProvider>
    </Provider>
);

export const Default = template.bind({});
