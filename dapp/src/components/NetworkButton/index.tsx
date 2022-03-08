import * as React from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';

import {supportedNetworks} from '../../services/connectors';
import {CHAIN_IDS} from '../../services/env';

import './styles.scss';

export const NetworkButton = (props: {
    networkLogo: string;
    networkName: string;
    switchNetwork: (chainId: number) => void;
}) => {
    return (
        <Box className="network-button-container">
            <FormControl variant="standard">
                <InputLabel id="network-button-label">
                    <Box
                        className={`network-holder ${
                            CHAIN_IDS.length === 1 ? 'single' : ''
                        }`}
                    >
                        <img src={props.networkLogo} alt="Network logo" />
                        <Typography className="network-name">
                            {props.networkName}
                        </Typography>
                        {CHAIN_IDS.length > 1 && <KeyboardArrowDownIcon />}
                    </Box>
                </InputLabel>
                {CHAIN_IDS.length > 1 && (
                    <Select
                        labelId="network-button-label"
                        className="network-dropdown"
                        variant="filled"
                    >
                        {CHAIN_IDS.map(chainId => {
                            const requiredNetwork = supportedNetworks[chainId];
                            return (
                                <MenuItem className="menu-item" key={chainId}>
                                    <Box className="network-holder">
                                        <img
                                            src={requiredNetwork.logo}
                                            alt="Network logo"
                                        />
                                        <Typography
                                            className="network-name"
                                            onClick={() => {
                                                props.switchNetwork(chainId);
                                            }}
                                        >
                                            {requiredNetwork.name}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            );
                        })}
                    </Select>
                )}
            </FormControl>
        </Box>
    );
};
