import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Provider} from 'react-redux';
import {Link, MemoryRouter} from 'react-router-dom';
import {store} from 'redux/store';

import {NavigationLinkProps} from './NavigationLink.interface';

import NavigationLink from './index';

export default {
    title: 'NavigationLink',
    component: NavigationLink,
} as Meta;

const Template: Story<NavigationLinkProps> = args => (
    <Provider store={store}>
        <MemoryRouter>
            <Link to={args.to}>{args.children}</Link>
        </MemoryRouter>
    </Provider>
);

export const Default = Template.bind({});

Default.args = {
    to: '/',
    children: 'Staking',
};

export const Faucet = Template.bind({});

Faucet.args = {
    to: '/faucet',
    children: 'Faucet',
};
