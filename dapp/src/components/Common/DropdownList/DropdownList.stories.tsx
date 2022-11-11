import React from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {Box, FormControl, InputLabel, MenuItem} from '@mui/material';
// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {AddTokenButton} from 'components/AddTokenButton';
import ContractButton from 'components/ContractButton';
import {ContractsListButton} from 'components/ContractsListButton';
import {LogoutButton} from 'components/LogoutButton';
import {Provider} from 'react-redux';
import {MemoryRouter} from 'react-router-dom';
import {store} from 'redux/store';
import 'styles/dropdown-button.scss';

import {DropdownListProps} from './DropdownList.interface';

import DropdownList from './index';

export default {
    title: 'DropdownList',
    component: DropdownList,
} as Meta;

const Template: Story<DropdownListProps> = args => (
    <Provider store={store}>
        <MemoryRouter>
            <Box className="dropdown-button-container">
                <FormControl variant="standard">
                    <InputLabel id="dropdown-list-button-label">
                        <Box className="dropdown-button-holder wallet-button-holder">
                            <KeyboardArrowDownIcon />
                        </Box>
                    </InputLabel>
                    <DropdownList setOpen={args.setOpen}>
                        <MenuItem className="menu-item" key={1}>
                            <ContractButton />
                        </MenuItem>
                        <MenuItem className="menu-item" key={2}>
                            <AddTokenButton />
                        </MenuItem>
                        <MenuItem className="menu-item" key={3}>
                            <ContractsListButton />
                        </MenuItem>
                        <MenuItem className="menu-item" key={4}>
                            <LogoutButton />
                        </MenuItem>
                    </DropdownList>
                </FormControl>
            </Box>
        </MemoryRouter>
    </Provider>
);

export const Default = Template.bind({});

Default.args = {
    setOpen: () => true,
};
