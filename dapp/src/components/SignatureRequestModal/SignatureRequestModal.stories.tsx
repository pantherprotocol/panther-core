// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';

import SignatureRequestModal from './index';

export default {
    title: 'SignatureRequestModal',
    component: SignatureRequestModal,
} as Meta;

const Template: Story = () => (
    <Provider store={store}>
        <SignatureRequestModal />
    </Provider>
);

export const Default = Template.bind({});
