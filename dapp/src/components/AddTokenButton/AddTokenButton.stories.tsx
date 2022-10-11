import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Provider} from 'react-redux';

import {store} from '../../redux/store';

import {AddTokenButton} from './index';

export default {
    title: 'AddTokenButton',
    component: AddTokenButton,
} as Meta;

const Template: Story = () => (
    <Provider store={store}>
        <AddTokenButton />
    </Provider>
);

export const Default = Template.bind({});
