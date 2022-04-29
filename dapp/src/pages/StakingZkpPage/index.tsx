import React, {useCallback, useEffect, useState} from 'react';

import {Container} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import {Box} from '@mui/system';
import {useWeb3React} from '@web3-react/core';

import AdvancedStakingComingSoon from '../../components/AdvancedStakingComingSoon';
import BalanceCard from '../../components/BalanceCard';
import CurrentStakeAPY from '../../components/CurrentStakeAPY';
import {Footer} from '../../components/Footer';
import Header from '../../components/Header';
import StakingUnstakingCard from '../../components/StakingUnstakingCard';
import {useEagerConnect, useInactiveListener} from '../../hooks/web3';
import background from '../../images/background.png';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {blurSelector} from '../../redux/slices/blur';
import {getTotalStaked} from '../../redux/slices/totalStaked';
import {
    getUnclaimedRewards,
    resetUnclaimedRewards,
} from '../../redux/slices/unclaimedRewards';
import {getZKPTokenMarketPrice} from '../../redux/slices/zkpMarketPrice';
import {
    getZkpStakedBalance,
    resetZkpStakedBalance,
} from '../../redux/slices/zkpStakedBalance';
import {
    getZkpTokenBalance,
    resetZkpTokenBalance,
} from '../../redux/slices/zkpTokenBalance';
import {formatAccountAddress} from '../../services/account';
import {injected, supportedNetworks, Network} from '../../services/connectors';
// import {chainHasStakingOpen} from '../../services/staking';
import {switchNetwork} from '../../services/wallet';

import './styles.scss';

function StakingZkpPage() {
    const context = useWeb3React();
    const dispatch = useAppDispatch();
    const {connector, chainId, activate, deactivate, active, account, error} =
        context;

    // Logic to recognize the connector currently being activated
    const [activatingConnector, setActivatingConnector] = useState<any>();
    const [, setChainError] = useState('');
    const accountAddress = formatAccountAddress(account);

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
    const suppressInactiveListeners =
        !triedEager || activatingConnector || error;
    useInactiveListener(suppressInactiveListeners);

    const currentNetwork: Network | null =
        context && context.chainId ? supportedNetworks[context.chainId] : null;

    const onConnect = useCallback(async () => {
        console.debug('onConnect: error', error, '/ chainId', chainId);
        if (!chainId) {
            console.debug(
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
            dispatch(resetZkpTokenBalance());
            dispatch(resetZkpStakedBalance());
            dispatch(resetUnclaimedRewards());
        }
    }, [active, chainId, deactivate, dispatch]);

    useEffect(() => {
        dispatch(getZKPTokenMarketPrice());
        dispatch(getZkpTokenBalance(context));
        dispatch(getZkpStakedBalance(context));
        dispatch(getUnclaimedRewards(context));
        dispatch(getTotalStaked(context));
    }, [context, dispatch]);

    const isBlur = useAppSelector(blurSelector);

    return (
        <Box
            className={`main-app ${isBlur && 'isBlur'}`}
            sx={{
                backgroundImage: `url(${background})`,
            }}
        >
            <CssBaseline />

            <Header
                onConnect={() => {
                    onConnect();
                }}
                switchNetwork={(chainId: number) => {
                    switchNetwork(chainId, setChainError);
                }}
                disconnect={() => {
                    disconnect();
                }}
                networkName={currentNetwork?.name}
                networkSymbol={currentNetwork?.symbol}
                networkLogo={currentNetwork?.logo}
            />

            <Box className="main-box-holder">
                <Container className="main-container">
                    <Grid container>
                        <Grid item md={1} xs={12} />
                        <Grid item container spacing={2} md={10} xs={12}>
                            <Grid item xs={12} md={5}>
                                <Box width={'100%'}>
                                    <BalanceCard
                                        accountAddress={accountAddress}
                                        networkLogo={currentNetwork?.logo}
                                    />
                                    <AdvancedStakingComingSoon />
                                </Box>
                                <Footer />
                            </Grid>
                            <Grid
                                item
                                xs={12}
                                md={7}
                                className="apy-staking-right-panel"
                            >
                                <Box width={'100%'}>
                                    <CurrentStakeAPY
                                        networkName={currentNetwork?.name}
                                    />
                                    <StakingUnstakingCard
                                        networkLogo={currentNetwork?.logo}
                                        onConnect={() => {
                                            onConnect();
                                        }}
                                        switchNetwork={(chainId: number) => {
                                            switchNetwork(
                                                chainId,
                                                setChainError,
                                            );
                                        }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                        <Grid item md={1} xs={12} />
                    </Grid>
                </Container>
            </Box>
        </Box>
    );
}

export default StakingZkpPage;
