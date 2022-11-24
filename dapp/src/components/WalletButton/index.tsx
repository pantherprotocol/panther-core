// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';
import {useState} from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {MenuItem} from '@mui/material';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Address from 'components/Address';
import {AddTokenButton} from 'components/AddTokenButton';
import DropdownList from 'components/Common/DropdownList';
import ContractButton from 'components/ContractButton';
import {ContractsListButton} from 'components/ContractsListButton';
import {LogoutButton} from 'components/LogoutButton';
import {CHAIN_IDS} from 'services/env';

import './styles.scss';

export const WalletButton = () => {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <Box
            className={`dropdown-button-container wallet-button-container ${
                open ? 'open' : ''
            }`}
        >
            <FormControl variant="standard">
                <InputLabel id="dropdown-list-button-label">
                    <Box className="dropdown-button-holder wallet-button-holder">
                        <Address />
                        <KeyboardArrowDownIcon className="arrow-icon" />
                    </Box>
                </InputLabel>
                {CHAIN_IDS.length > 1 && (
                    <DropdownList setOpen={setOpen}>
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
                )}
            </FormControl>
        </Box>
    );
};
