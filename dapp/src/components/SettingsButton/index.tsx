import * as React from 'react';

import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import {Link} from 'react-router-dom';

import {AddTokenButton} from '../AddTokenButton';
import {ContractButton} from '../ContractButton';
import {LogoutButton} from '../LogoutButton';

import './styles.scss';

export const SettingsButton = () => {
    return (
        <Box className="settings-button-holder">
            <Box className="settings-button-container">
                <FormControl variant="standard">
                    <InputLabel id="settings-button-label">
                        <MoreHorizIcon />
                    </InputLabel>
                    <Select
                        labelId="settings-button-label"
                        className="settings-dropdown"
                        variant="filled"
                    >
                        <MenuItem className="menu-item">
                            <ContractButton />
                        </MenuItem>
                        <MenuItem className="menu-item">
                            <AddTokenButton />
                        </MenuItem>
                        <MenuItem className="menu-item">
                            <Link to="/contracts">
                                <div className="contract-button-holder">
                                    <Button
                                        variant="contained"
                                        className="contract-button"
                                    >
                                        <span>Contracts List</span>
                                    </Button>
                                </div>
                            </Link>
                        </MenuItem>
                        <MenuItem className="menu-item">
                            <LogoutButton />
                        </MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </Box>
    );
};
