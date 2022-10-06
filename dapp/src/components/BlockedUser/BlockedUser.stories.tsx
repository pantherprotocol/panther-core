import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Provider} from 'react-redux';
import {MemoryRouter} from 'react-router-dom';

import {store} from '../../redux/store';

import BlockedUser from './index';

export default {
    title: 'BlockedUser',
    component: BlockedUser,
} as Meta;

const Template: Story = () => (
    <Provider store={store}>
        <MemoryRouter>
            <BlockedUser />
        </MemoryRouter>
    </Provider>
);

export const Default = Template.bind({});
