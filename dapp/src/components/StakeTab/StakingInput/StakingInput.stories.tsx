import React from 'react';

// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {Provider} from 'react-redux';

import {store} from '../../../redux/store';

import {StakingInputProps} from './StakingInput.interface';

import StakingInput from '.';

export default {
    component: StakingInput,
    title: 'components/StakingInput',
} as Meta;

const Template: Story<StakingInputProps> = args => (
    <Provider store={store}>
        <StakingInput {...args} />
    </Provider>
);

export const Default = Template.bind({});
Default.args = {
    amountToStake: '20',
};
