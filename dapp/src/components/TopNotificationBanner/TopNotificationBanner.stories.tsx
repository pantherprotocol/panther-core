// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';

import {TopNotificationBannerProps} from './TopNotificationBanner.interface';

import TopNotificationBanner from './index';

export default {
    title: 'TopNotificationBanner',
    component: TopNotificationBanner,
} as Meta;

const Template: Story<TopNotificationBannerProps> = args => (
    <Provider store={store}>
        <TopNotificationBanner {...args} />
    </Provider>
);

export const Default = Template.bind({});
Default.args = {
    text: 'This is a top notification banner text',
};
