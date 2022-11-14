import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';

import {AccountBalanceProps} from './AccountBalance.interface';

import AccountBalance from './index';

export default {
    title: 'AccountBalance',
    component: AccountBalance,
} as Meta;

const Template: Story<AccountBalanceProps> = args => (
    <Provider store={store}>
        <AccountBalance {...args} />
    </Provider>
);

export const Default = Template.bind({});
Default.args = {
    networkSymbol: 'MATIC',
};

export const ETH = Template.bind({});
ETH.args = {
    networkSymbol: 'ETH',
};
