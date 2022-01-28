import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import logo from '../../images/panther-logo.svg';
import stakingIcon from '../../images/Icon_circle.svg';
import docs from '../../images/docs.png';
import Address from '../Address';
import accountAvatar from '../../images/metamask.png';
import {LogoutButton} from '../LogoutButton';
import {SafeLink} from '../../services/links';
import {UnsupportedChainIdError, useWeb3React} from '@web3-react/core';
import {useState} from 'react';
import {NoEthereumProviderError} from '@web3-react/injected-connector';
import {useEffect} from 'react';
import {onWrongNetwork, requiredNetwork} from '../../services/connectors';
import {
    formatAccountAddress,
    formatAccountBalance,
} from '../../services/account';
import {ConnectButton} from '../ConnectButton';
import {AddTokenButton} from '../AddTokenButton';
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
        formatAccountBalance(balance, requiredNetwork.symbol) || 'Error';

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
                            <Box className="logo" marginRight={'30px'}>
                                <SafeLink href="/">
                                    <img src={logo} alt="Logo" />
                                </SafeLink>
                            </Box>
                            <Box
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                margin={'0 10px'}
                            >
                                <Box className="header-icons">
                                    <img src={stakingIcon} />
                                </Box>

                                <Typography
                                    className="nav-item main-navigation"
                                    variant="subtitle2"
                                    lineHeight={3}
                                >
                                    <a href="/">Staking</a>
                                </Typography>
                            </Box>
                            <Box
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                margin={'0 10px'}
                            >
                                <Box className="header-icons">
                                    <img src={docs} />
                                </Box>
                                <Typography
                                    className="nav-item"
                                    variant="subtitle2"
                                >
                                    <a href="https://docs.pantherprotocol.io/">
                                        Docs
                                    </a>
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid
                            item
                            md={6}
                            xs={12}
                            display={'flex'}
                            justifyContent={'end'}
                            alignItems={'center'}
                            className="header-right-container"
                        >
                            {/* connection button */}
                            {!active && !wrongNetwork && (
                                <div className="address-btn">
                                    <ConnectButton
                                        text={
                                            isNoEthereumProviderError
                                                ? 'Install MetaMask'
                                                : 'Connect Wallet'
                                        }
                                        onClick={() => {
                                            if (isNoEthereumProviderError) {
                                                window.open(
                                                    'https://metamask.io',
                                                );
                                            } else {
                                                props.onConnect();
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            {wrongNetwork && (
                                <div className="address-btn">
                                    <ConnectButton
                                        text={'Switch network'}
                                        onClick={() => {
                                            props.switchNetwork();
                                        }}
                                    />
                                </div>
                            )}

                            {/* account details */}
                            {active && !wrongNetwork && (
                                <>
                                    {!tokenAdded && (
                                        <AddTokenButton
                                            setTokenAdded={setTokenAdded}
                                        />
                                    )}
                                    <Box
                                        display={'flex'}
                                        justifyContent={'space-between'}
                                        alignItems={'center'}
                                        margin={'0 5px'}
                                        padding={'8px'}
                                        sx={{
                                            background: '#63728835',
                                            borderRadius: '8px',
                                            height: '50px',
                                        }}
                                    >
                                        {accountAddress && (
                                            <Address
                                                accountAvatar={accountAvatar}
                                                accountAddress={accountAddress}
                                            />
                                        )}
                                        <Typography
                                            variant="subtitle2"
                                            width={'100%'}
                                            display={'flex'}
                                            justifyContent={'center'}
                                            alignItems={'center'}
                                            sx={{
                                                background: '#14161935',
                                                borderRadius: '8px',
                                                height: '35px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {accountBalance}
                                        </Typography>
                                    </Box>
                                </>
                            )}

                            {/* disconnection button */}
                            {active && !wrongNetwork && (
                                <Box
                                    sx={{
                                        background: '#63728820',
                                        borderRadius: '8px',
                                        height: '50px',
                                    }}
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
