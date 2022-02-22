import {useState, useEffect} from 'react';
import * as React from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import {UnsupportedChainIdError, useWeb3React} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';

import docsIcon from '../../images/docs-icon.svg';
import governanceIcon from '../../images/governance-icon.svg';
import accountAvatar from '../../images/meta-mask-icon.svg';
import logo from '../../images/panther-logo.svg';
import stakingIcon from '../../images/staking-icon.svg';
import {formatAccountAddress} from '../../services/account';
import {onWrongNetwork, requiredNetwork} from '../../services/connectors';
import {SafeLink, safeOpenMetamask} from '../../services/links';
import {formatCurrency} from '../../utils';
import Address from '../Address';
import {AddTokenButton} from '../AddTokenButton';
import {ConnectButton} from '../ConnectButton';
import {LogoutButton} from '../LogoutButton';

import './styles.scss';

const Header = props => {
    const context = useWeb3React();
    const {account, library, chainId, active, error} = context;
    const [balance, setBalance] = useState(null);
    const [wrongNetwork, setWrongNetwork] = useState(false);
    const [tokenAdded, setTokenAdded] = useState<boolean>(
        !!localStorage.getItem('ZKP-Staking:tokenAdded'),
    );

    const isNoEthereumProviderError = error instanceof NoEthereumProviderError;

    useEffect((): any => {
        const wrongNetwork =
            onWrongNetwork(context) || error instanceof UnsupportedChainIdError;
        setWrongNetwork(wrongNetwork);
        console.debug(
            'header: wrongNetwork',
            wrongNetwork,
            '/ active',
            active,
            '/ error',
            error,
        );
        if (wrongNetwork) {
            return;
        }

        if (account && library) {
            let stale = false;

            library
                .getBalance(account)
                .then((balance: any) => {
                    if (!stale) {
                        setBalance(balance);
                        setWrongNetwork(onWrongNetwork(context));
                    }
                })
                .catch(() => {
                    if (!stale) {
                        setBalance(null);
                    }
                });

            return () => {
                stale = true;
                setBalance(null);
            };
        }
    }, [context, active, account, library, chainId, error]); // ensures refresh if referential identity of library doesn't change across chainIds

    const accountAddress = formatAccountAddress(account) || null;
    const accountBalance =
        formatCurrency(balance) + ' ' + requiredNetwork.symbol || '-';

    return (
        <Box sx={{flexGrow: 1}}>
            <AppBar position="static" className="app-bar">
                <Toolbar>
                    <Grid container>
                        <Grid item lg={6} md={12} xs={12} className="nav-bar">
                            <Box className="logo">
                                <SafeLink href="https://pantherprotocol.io/">
                                    <img src={logo} alt="Logo" />
                                </SafeLink>
                            </Box>
                            <Box className="nav-item active-item">
                                <img src={stakingIcon} />

                                <Typography>
                                    <a href="/">Staking</a>
                                </Typography>
                            </Box>
                            <Box className="nav-item">
                                <img src={docsIcon} />
                                <Typography>
                                    <SafeLink href="https://docs.pantherprotocol.io/panther-dao-and-zkp/the-zkp-token/staking">
                                        Docs
                                    </SafeLink>
                                </Typography>
                            </Box>
                            <Box className="nav-item">
                                <img src={governanceIcon} />
                                <Typography>
                                    <SafeLink href="https://snapshot.org/#/pantherprotocol.eth">
                                        Governance
                                    </SafeLink>
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid
                            item
                            lg={6}
                            md={12}
                            xs={12}
                            className="header-right-container"
                        >
                            {/* connection button */}
                            {!active && !wrongNetwork && (
                                <Box className="address-btn">
                                    <ConnectButton
                                        text={
                                            isNoEthereumProviderError
                                                ? 'Install MetaMask'
                                                : 'Connect Wallet'
                                        }
                                        onClick={() => {
                                            if (isNoEthereumProviderError) {
                                                safeOpenMetamask();
                                            } else {
                                                props.onConnect();
                                            }
                                        }}
                                    />
                                </Box>
                            )}

                            {wrongNetwork && (
                                <Box className="address-btn">
                                    <ConnectButton
                                        text={'Switch network'}
                                        onClick={() => {
                                            props.switchNetwork();
                                        }}
                                    />
                                </Box>
                            )}

                            {/* account details */}
                            {active && !wrongNetwork && (
                                <>
                                    {!tokenAdded && (
                                        <Box>
                                            <AddTokenButton
                                                setTokenAdded={setTokenAdded}
                                            />
                                        </Box>
                                    )}
                                    <Box className="address-and-balance-holder">
                                        {accountAddress && (
                                            <Box>
                                                <Address
                                                    accountAvatar={
                                                        accountAvatar
                                                    }
                                                    accountAddress={
                                                        accountAddress
                                                    }
                                                />
                                            </Box>
                                        )}
                                        <Typography className="account-balance">
                                            {accountBalance}
                                        </Typography>
                                    </Box>
                                </>
                            )}

                            {/* disconnection button */}
                            {active && !wrongNetwork && (
                                <Box
                                    onClick={() => {
                                        props.disconnect();
                                    }}
                                >
                                    <LogoutButton />
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </Toolbar>
            </AppBar>
        </Box>
    );
};

export default Header;
