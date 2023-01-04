// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {Box, Typography} from '@mui/material';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {networkLogo} from 'components/common/NetworkLogo';
import {NetworkButtonProps} from 'components/NetworkButton/NetworkButton.interface';
import {supportedNetworks} from 'services/connectors';
import {CHAIN_IDS} from 'services/env';
import {switchNetwork} from 'services/wallet';

import './styles.scss';

export default function NetworkButton(props: NetworkButtonProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div className="dropdown-list">
            <Button
                id="network-list-button"
                className={`dropdown-list-button ${open ? 'open' : ''}`}
                aria-controls={open ? 'network-list' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                disableElevation
                onClick={handleClick}
            >
                <Box>
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
            </Button>

            <Menu
                id="network-list"
                className="dropdown-list-menu"
                MenuListProps={{
                    'aria-labelledby': 'network-list-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {CHAIN_IDS.map(chainId => {
                    const requiredNetwork = supportedNetworks[chainId];
                    return (
                        <MenuItem
                            className="menu-item"
                            key={chainId}
                            onClick={() => {
                                handleClose();
                                switchNetwork(chainId);
                            }}
                        >
                            <img
                                src={networkLogo(requiredNetwork.logo)}
                                alt="Network logo"
                            />
                            <Typography data-testid="network-button_network-button_select-option">
                                {requiredNetwork.name}
                            </Typography>
                        </MenuItem>
                    );
                })}
            </Menu>
        </div>
    );
}
