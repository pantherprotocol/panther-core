import * as React from 'react';
import {useState} from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {MenuItem} from '@mui/material';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

import {CHAIN_IDS} from '../../services/env';
import Address from '../Address';
import {AddTokenButton} from '../AddTokenButton';
import DropdownList from '../Common/DropdownList';
import {ContractButton} from '../ContractButton';
import {ContractsListButton} from '../ContractsListButton';
import {LogoutButton} from '../LogoutButton';

import './styles.scss';

export const WalletButton = () => {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <Box className={`wallet-button-container ${open ? 'open' : ''}`}>
            <FormControl variant="standard">
                <InputLabel id="dropdown-list-button-label">
                    <Box className="wallet-button-holder">
                        <Address />
                        <KeyboardArrowDownIcon />
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
