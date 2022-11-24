// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';

import {PrimaryActionButtonProps} from './PrimaryActionButton.interface';

import PrimaryActionButton from './index';

export default {
    title: 'PrimaryActionButton',
    component: PrimaryActionButton,
    argTypes: {
        argTypes: {onClick: {action: 'clicked'}},
    },
} as Meta;

const Template: Story<PrimaryActionButtonProps> = args => (
    <Provider store={store}>
        <PrimaryActionButton {...args} />
    </Provider>
);

export const Default = Template.bind({});

Default.args = {
    children: 'dummy button',
    onClick: () => console.log(),
};

export const Disabled = Template.bind({});

Disabled.args = {
    children: 'dummy button',
    disabled: true,
};
