import React, {useCallback, useEffect, useState} from 'react';
import {Container} from '@mui/material';
import Grid from '@mui/material/Grid';
import {Box} from '@mui/system';
import CssBaseline from '@mui/material/CssBaseline';
import './styles.scss';
import BalanceCard from '../../components/Cards/BalanceCard';
import StakingCard from '../../components/Cards/StakingCard';
import background from '../../images/app-background.png';
import {Footer} from '../../components/Footer';
import {switchNetwork} from '../../services/wallet';
// import {useLocation} from 'react-router-dom';
import {useEagerConnect, useInactiveListener} from '../../hooks/web3';
import {injected} from '../../services/connectors';
import {useWeb3React} from '@web3-react/core';
import {Web3Provider} from '@ethersproject/providers';
import StakingHeader from '../../components/StakingHeader';

// const localStorage = window.localStorage;

function StakingZkpPage() {
    const context = useWeb3React<Web3Provider>();

    const {connector, chainId, activate, deactivate, active, error} = context;

    // Logic to recognize the connector currently being activated
    const [activatingConnector, setActivatingConnector] = useState<any>();
    // const {search: locationQueryString} = useLocation();
    const [, setChainError] = useState('');

    // Handle logic to eagerly connect to the injected ethereum provider, if it
    // exists and has granted access already
    const triedEager = useEagerConnect();

    useEffect(() => {
        if (activatingConnector && activatingConnector === connector) {
            setActivatingConnector(undefined);
        }
    }, [activatingConnector, connector]);

    // Set up listeners for events on the injected ethereum provider, if it exists
    // and is not in the process of activating.
    // console.debug('triedEager', triedEager);
    // console.debug('activatingConnector', activatingConnector);
    // const connected = injected === connector;
    // const suppressInactiveListeners = activatingConnector || error;
    const suppressInactiveListeners =
        !triedEager || activatingConnector || error;
    useInactiveListener(suppressInactiveListeners);

    const onConnect = useCallback(async () => {
        console.log('onConnect: error', error, '/ chainId', chainId);
        if (!chainId) {
            console.log(
                'Connecting to the network; injected connector:',
                injected,
            );
            setActivatingConnector(injected);
            await activate(injected);
        } else {
            deactivate();
        }
    }, [error, chainId, activate, deactivate]);

    const disconnect = useCallback(async () => {
        if (active && chainId) {
            deactivate();
        }
    }, [active, chainId, deactivate]);

    return (
        <Box
            className="main-app"
            sx={{
                backgroundImage: `url(${background})`,
                backgroundPosition: 'center center',
                backgroundSize: 'cover',
            }}
        >
            <CssBaseline />

            <StakingHeader
                onConnect={() => {
                    onConnect();
                }}
                switchNetwork={() => {
                    switchNetwork(setChainError);
                }}
                disconnect={() => {
                    disconnect();
                }}
            />

            <Box
                sx={{
                    marginTop: '100px',
                }}
            >
                <Container maxWidth="lg">
                    <Grid container>
                        <Grid item md={1} xs={12}></Grid>
                        <Grid item container spacing={2} md={10} xs={12}>
                            <Grid
                                item
                                xs={12}
                                md={5}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'start'}
                            >
                                <BalanceCard />
                            </Grid>
                            <Grid
                                item
                                xs={12}
                                md={7}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                            >
                                <StakingCard />
                            </Grid>
                        </Grid>
                        <Grid item md={1} xs={12}></Grid>
                    </Grid>
                </Container>
            </Box>

            <Footer />
        </Box>
    );
}

export default StakingZkpPage;
