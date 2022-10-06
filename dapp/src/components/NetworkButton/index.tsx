import * as React from 'react';
import {useState} from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {MenuItem} from '@mui/material';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';

import {supportedNetworks} from '../../services/connectors';
import {CHAIN_IDS} from '../../services/env';
import {switchNetwork} from '../../services/wallet';
import DropdownList from '../Common/DropdownList';
import {networkLogo} from '../Common/NetworkLogo';

import {NetworkButtonProps} from './NetworkButton.interface';

import './styles.scss';

export const NetworkButton = (props: NetworkButtonProps) => {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <Box
            data-testid="network-button_network-button_container"
            className={`dropdown-button-container network-button-container ${
                open ? 'open' : ''
            }`}
        >
            <FormControl variant="standard">
                <InputLabel
                    id="dropdown-list-button-label"
                    data-testid="network-button_network-button_select-label"
                >
                    <Box
                        className={`dropdown-button-holder network-button-holder`}
                    >
                        <img
                            src={networkLogo(props.networkLogo)}
                            alt="Network logo"
                            data-testid="network-button_network-button_select-logo"
                        />
                        <Typography className="network-name">
                            {props.networkName}
                        </Typography>
                        {CHAIN_IDS.length > 1 && <KeyboardArrowDownIcon />}
                    </Box>
                </InputLabel>
                {CHAIN_IDS.length > 1 && (
                    <DropdownList
                        setOpen={setOpen}
                        data-testid="network-button_network-button-select"
                    >
                        {CHAIN_IDS.map(chainId => {
                            const requiredNetwork = supportedNetworks[chainId];
                            return (
                                <MenuItem className="menu-item" key={chainId}>
                                    <img
                                        src={networkLogo(requiredNetwork.logo)}
                                        alt="Network logo"
                                    />
                                    <Typography
                                        data-testid="network-button_network-button_select-option"
                                        onClick={() => {
                                            switchNetwork(chainId);
                                        }}
                                    >
                                        {requiredNetwork.name}
                                    </Typography>
                                </MenuItem>
                            );
                        })}
                    </DropdownList>
                )}
            </FormControl>
        </Box>
    );
};
