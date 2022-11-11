import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';

import {MessageWithTxProps} from './MessageWithTxProps.interface';

import {MessageWithTx} from './index';

export default {
    title: 'MessageWithTx',
    component: MessageWithTx,
} as Meta;

const Template: Story<MessageWithTxProps> = args => (
    <Provider store={store}>
        <MessageWithTx {...args} />
    </Provider>
);

export const Default = Template.bind({});
Default.args = {
    message: 'message',
    chainId: 80001,
    linkText: 'link text',
    txHash: '0x0f721f219d7cbac5ffc605a4dd5b017a7b3813d9686a1cfe75fa712ddbd2ca78',
};
