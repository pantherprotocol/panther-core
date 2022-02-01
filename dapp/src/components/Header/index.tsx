import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import logo from '../../images/panther-logo.svg';
import stakingIcon from '../../images/staking-icon.svg';
import docsIcon from '../../images/docs-icon.svg';
import governanceIcon from '../../images/governance-icon.svg';
import Address from '../Address';
import accountAvatar from '../../images/meta-mask-icon.svg';
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
        formatAccountBalance(balance, requiredNetwork.symbol) || '-';

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
                            <Box
                                className="logo"
                                marginRight={'10px'}
                                width={'10%'}
                            >
                                <SafeLink href="https://pantherprotocol.io/">
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
                                    <img src={docsIcon} />
                                </Box>
                                <Typography
                                    className="nav-item"
                                    variant="subtitle2"
                                >
                                    <SafeLink href="https://docs.pantherprotocol.io/panther-dao-and-zkp/the-zkp-token/staking">
                                        Docs
                                    </SafeLink>
                                </Typography>
                            </Box>
                            <Box
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                            >
                                <Box className="header-icons">
                                    {' '}
                                    <img src={governanceIcon} />
                                </Box>
                                <Typography
                                    className="nav-item"
                                    variant="subtitle2"
                                >
                                    <a href="https://snapshot.org/#/pantherprotocol.eth">
                                        Governance
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
                                        <Box>
                                            <AddTokenButton
                                                setTokenAdded={setTokenAdded}
                                            />
                                        </Box>
                                    )}
                                    <Box
                                        display={'flex'}
                                        justifyContent={'space-between'}
                                        alignItems={'center'}
                                        margin={'0 20px'}
                                        padding={'8px'}
                                        sx={{
                                            background: '#63728835',
                                            borderRadius: '8px',
                                            height: '50px',
                                        }}
                                    >
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
                                        <Box>
                                            <Typography
                                                variant="subtitle2"
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                textAlign={'center'}
                                                fontWeight={'bold'}
                                                fontStyle={'normal'}
                                                lineHeight={42}
                                                fontSize={'14px'}
                                                padding={'8px 8px'}
                                                marginLeft={'20px'}
                                                sx={{
                                                    backgroundColor:
                                                        '#789ACD50',

                                                    borderRadius: '8px',
                                                    height: '35px',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {accountBalance}
                                            </Typography>
                                        </Box>
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
