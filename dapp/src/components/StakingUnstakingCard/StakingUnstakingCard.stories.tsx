import React from 'react';

import {Web3Provider} from '@ethersproject/providers';
// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Web3ReactProvider} from '@web3-react/core';
import {Provider} from 'react-redux';
import {MemoryRouter} from 'react-router-dom';

import {store} from '../../redux/store';

import StakingUnstakingCard from './index';

export default {
    title: 'StakingUnstakingCard',
    component: StakingUnstakingCard,
} as Meta;

function getLibrary(provider: any): Web3Provider {
    const library = new Web3Provider(provider);
    library.pollingInterval = 12000;
    return library;
}

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
