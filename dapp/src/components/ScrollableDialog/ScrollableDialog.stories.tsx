import React from 'react';

import {action} from '@storybook/addon-actions';
// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';

import {ScrollableDialogProps} from './ScrollableDialog.interface';

import ScrollableDialog from './index';

export default {
    title: 'ScrollableDialog',
    component: ScrollableDialog,
} as Meta;

const Template: Story<ScrollableDialogProps> = args => (
    <Provider store={store}>
        <ScrollableDialog {...args} />
    </Provider>
);

export const Default = Template.bind({});

Default.args = {
    handleClose: action('clicked'),
    title: 'test',
};
