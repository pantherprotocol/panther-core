import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';
import 'styles/dropdown-button.scss';

import {NetworkButtonProps} from './NetworkButton.interface';

import {NetworkButton} from './index';

export default {
    title: 'NetworkButton',
    component: NetworkButton,
} as Meta;

const Template: Story<NetworkButtonProps> = args => (
    <Provider store={store}>
        <NetworkButton {...args} />
    </Provider>
);

export const Default = Template.bind({});

Default.args = {
    networkLogo: 'ETH',
    networkName: 'Ethereum',
};

export const Mumbai = Template.bind({});

Mumbai.args = {
    networkLogo: 'MATIC',
    networkName: 'Mumbai',
};
