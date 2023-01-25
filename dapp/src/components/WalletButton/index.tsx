// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {Box} from '@mui/material';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Address from 'components/Address';
import {AddTokenButton} from 'components/AddTokenButton';
import {classnames} from 'components/common/classnames';
import ContractButton from 'components/ContractButton';
import {ContractsListButton} from 'components/ContractsListButton';
import {LogoutButton} from 'components/LogoutButton';

import './styles.scss';

export default function WalletButton() {
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
                id="wallet-list-button"
                className={classnames('dropdown-list-button', {open})}
                aria-controls={open ? 'wallet-list' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                disableElevation
                onClick={handleClick}
            >
                <Box>
                    <Address />
                    <KeyboardArrowDownIcon className="arrow-icon" />
                </Box>
            </Button>

            <Menu
                id="wallet-list"
                className="dropdown-list-menu"
                MenuListProps={{
                    'aria-labelledby': 'wallet-list-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
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
            </Menu>
        </div>
    );
}
