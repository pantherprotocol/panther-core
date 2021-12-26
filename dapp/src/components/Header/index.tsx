import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import './styles.scss';
import IconButton from '@mui/material/IconButton';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import logo from '../../images/panther-logo.svg';
import accountAvatar from '../../images/account-avatar.png';

export default function HeaderBar() {
    return (
        <Box sx={{flexGrow: 1}}>
            <AppBar position="static" className="app-bar">
                <Toolbar>
                    <Grid container>
                        <Grid
                            item
                            md={6}
                            xs={12}
                            display={'flex'}
                            alignItems={'center'}
                        >
                            <Box className="logo">
                                <img src={logo} />
                            </Box>
                            <Typography
                                className="nav-item active"
                                variant="subtitle2"
                            >
                                Staking
                            </Typography>
                            <Typography
                                className="nav-item"
                                variant="subtitle2"
                            >
                                Docs
                            </Typography>
                            <Typography
                                className="nav-item"
                                variant="subtitle2"
                            >
                                Governance
                            </Typography>
                            <Typography
                                className="nav-item"
                                variant="subtitle2"
                            >
                                Analytics
                            </Typography>
                        </Grid>

                        <Grid
                            item
                            md={6}
                            xs={12}
                            display={'flex'}
                            justifyContent={'end'}
                            alignItems={'center'}
                        >
                            <Box className="addresses-box">
                                <Typography variant="subtitle2">
                                    2.51 ETH
                                </Typography>

                                <FormControl
                                    variant="standard"
                                    sx={{m: 0, minWidth: 155}}
                                >
                                    <Select
                                        labelId="addresses-select-standard-label"
                                        id="addresses-select-standard"
                                        variant="filled"
                                        value={'0xde90...982'}
                                    >
                                        <MenuItem
                                            selected
                                            value={'0xde90...982'}
                                        >
                                            0xde90...982{' '}
                                            <img
                                                className="account-avatar"
                                                src={accountAvatar}
                                            />{' '}
                                        </MenuItem>
                                        <MenuItem value={'0xde90...911'}>
                                            0xde90...911{' '}
                                            <img
                                                className="account-avatar"
                                                src={accountAvatar}
                                            />{' '}
                                        </MenuItem>
                                        <MenuItem value={'0xde90...923'}>
                                            0xde90...923{' '}
                                            <img
                                                className="account-avatar"
                                                src={accountAvatar}
                                            />{' '}
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box className="more-item">
                                <IconButton aria-label="delete">
                                    <MoreHorizIcon />
                                </IconButton>
                            </Box>
                        </Grid>
                    </Grid>
                </Toolbar>
            </AppBar>
        </Box>
    );
}
