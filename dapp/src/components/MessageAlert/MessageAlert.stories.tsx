import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Provider} from 'react-redux';

import {store} from '../../redux/store';

import {MessageAlertProps} from './MessageAlert.interface';

import MessageAlert from './index';

export default {
    title: 'MessageAlert',
    component: MessageAlert,
} as Meta;

const Template: Story<MessageAlertProps> = args => (
    <Provider store={store}>
        <MessageAlert {...args} />
    </Provider>
);

export const Default = Template.bind({});

Default.args = {
    title: 'Title',
    body: 'Description Body',
    notificationOwner: 'zAssetsPage',
};
