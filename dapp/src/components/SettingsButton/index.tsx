import * as React from 'react';

import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import {AddTokenButton} from '../AddTokenButton';
import {ContractButton} from '../ContractButton';
import {LogoutButton} from '../LogoutButton';

import './styles.scss';

export const SettingsButton = (props: {
    tokenAdded: boolean;
    setTokenAdded: (b: boolean) => void;
    disconnect: () => void;
}) => {
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
                        {!props.tokenAdded && (
                            <MenuItem className="menu-item">
                                <AddTokenButton
                                    setTokenAdded={props.setTokenAdded}
                                />
                            </MenuItem>
                        )}
                        <MenuItem className="menu-item">
                            <LogoutButton disconnect={props.disconnect} />
                        </MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </Box>
    );
};
