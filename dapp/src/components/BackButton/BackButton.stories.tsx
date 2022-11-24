// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';

import {BackButtonProps} from './BackButton.interface';

import BackButton from './index';

export default {
    title: 'BackButton',
    component: BackButton,
    argTypes: {
        argTypes: {onClick: {action: 'clicked'}},
    },
} as Meta;

const Template: Story<BackButtonProps> = args => (
    <Provider store={store}>
        <BackButton {...args} />
    </Provider>
);

export const Default = Template.bind({});

Default.args = {
    onClick: () => console.log('Button Clicked!'),
};
