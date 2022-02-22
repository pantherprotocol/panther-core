import * as React from 'react';
import {useState, useEffect} from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import {UnsupportedChainIdError, useWeb3React} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';

import docsIcon from '../../images/docs-icon.svg';
import governanceIcon from '../../images/governance-icon.svg';
import logo from '../../images/panther-logo.svg';
import stakingIcon from '../../images/staking-icon.svg';
import {formatAccountAddress} from '../../services/account';
import {onWrongNetwork} from '../../services/connectors';
import {CHAIN_IDS} from '../../services/env';
import {formatCurrency} from '../../utils/helpers';
import Address from '../Address';
import {SafeLink, safeOpenMetamask} from '../Common/links';
import {ConnectButton} from '../ConnectButton';
import {NetworkButton} from '../NetworkButton';
import {SettingsButton} from '../SettingsButton';

import './styles.scss';

const Header = props => {
    const context = useWeb3React();
    const {account, active, error, chainId} = context;
    const [wrongNetwork, setWrongNetwork] = useState(false);

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
    }, [context, active, error]); // ensures refresh if referential identity of library doesn't change across chainIds

    const accountAddress = formatAccountAddress(account) || null;

    const accountBalance =
        formatCurrency(props.balance) + ' ' + (props?.networkSymbol || '-');

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
                                            const chainIdToSwitch = chainId
                                                ? chainId
                                                : CHAIN_IDS[0];
                                            props.switchNetwork(
                                                chainIdToSwitch,
                                            );
                                        }}
                                    />
                                </Box>
                            )}

                            {/* account details */}
                            {active && !wrongNetwork && (
                                <>
                                    {props.networkName && props.networkLogo && (
                                        <NetworkButton
                                            networkName={props.networkName}
                                            networkLogo={props.networkLogo}
                                            switchNetwork={props.switchNetwork}
                                        />
                                    )}
                                    <Box className="address-and-balance-holder">
                                        {accountAddress && (
                                            <Box>
                                                <Address />
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
                                <Box>
                                    <SettingsButton
                                        disconnect={props.disconnect}
                                    />
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
