import React, {useCallback, useEffect, useState} from 'react';

import {Container} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import {Box} from '@mui/system';
import {useWeb3React} from '@web3-react/core';

import AdvancedStakingRewards from '../../components/AdvancedStakingRewards';
import BalanceCard from '../../components/BalanceCard';
import CurrentStakeAPY from '../../components/CurrentStakeAPY';
import {Footer} from '../../components/Footer';
import Header from '../../components/Header';
import StakingUnstakingCard from '../../components/StakingUnstakingCard';
import {useEagerConnect, useInactiveListener} from '../../hooks/web3';
import background from '../../images/background-adv.png';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {blurSelector} from '../../redux/slices/blur';
import {getStakeTerms} from '../../redux/slices/stakeTerms';
import {getTotalStaked} from '../../redux/slices/totalStaked';
import {getUnclaimedRewards} from '../../redux/slices/unclaimedStakesRewards';
import {getZKPTokenMarketPrice} from '../../redux/slices/zkpMarketPrice';
import {getZkpStakedBalance} from '../../redux/slices/zkpStakedBalance';
import {getZkpTokenBalance} from '../../redux/slices/zkpTokenBalance';
import {injected, supportedNetworks, Network} from '../../services/connectors';
import {chainHasAdvancedStaking} from '../../services/contracts';
import {switchNetwork} from '../../services/wallet';

import './styles.scss';

function StakingZkpPage() {
    const context = useWeb3React();
    const dispatch = useAppDispatch();

    const {connector, chainId, activate, deactivate, error} = context;

    const stakeType = chainHasAdvancedStaking(chainId) ? 'advanced' : 'classic';

    // Logic to recognize the connector currently being activated
    const [activatingConnector, setActivatingConnector] = useState<any>();
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

    useEffect(() => {
        dispatch(getZKPTokenMarketPrice);
        dispatch(getTotalStaked, context);
        dispatch(getZkpTokenBalance, context);
        dispatch(getZkpStakedBalance, context);
        dispatch(getUnclaimedRewards, context);
        dispatch(getStakeTerms, context);
    }, [context, dispatch]);

    const isBlur = useAppSelector(blurSelector);

    return (
        <Box
            className={`main-app advanced-staking-main-page ${
                isBlur && 'isBlur'
            }`}
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
                                    <BalanceCard />
                                </Box>
                            </Grid>
                            <Grid
                                item
                                xs={12}
                                md={7}
                                className="apy-staking-right-panel"
                            >
                                <Box width={'100%'}>
                                    {chainHasAdvancedStaking(chainId) ? (
                                        <AdvancedStakingRewards />
                                    ) : (
                                        <CurrentStakeAPY
                                            networkName={currentNetwork?.name}
                                        />
                                    )}
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
                                        stakeType={stakeType}
                                    />
                                </Box>
                                <Grid item xs={12} md={3}></Grid>
                            </Grid>
                        </Grid>
                        <Grid item md={1} xs={12} />
                    </Grid>
                </Container>
            </Box>
            <Footer />
        </Box>
    );
}

export default StakingZkpPage;
