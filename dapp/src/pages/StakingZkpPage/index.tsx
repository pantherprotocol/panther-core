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
import {useEagerConnect, useInactiveListener} from '../../hooks/web3';
import {injected} from '../../services/connectors';
import {useWeb3React} from '@web3-react/core';
import {Web3Provider} from '@ethersproject/providers';
import StakingHeader from '../../components/StakingHeader';
import * as stakingService from '../../services/staking';
import * as accountService from '../../services/account';
import {BigNumber} from '@ethersproject/bignumber';
import {utils} from 'ethers';
import {formatUSDPrice} from '../../services/account';

function StakingZkpPage() {
    const context = useWeb3React<Web3Provider>();

    const {
        connector,
        chainId,
        activate,
        deactivate,
        active,
        account,
        library,
        error,
    } = context;

    // Logic to recognize the connector currently being activated
    const [activatingConnector, setActivatingConnector] = useState<any>();
    const [, setChainError] = useState('');
    const [tokenBalance, setTokenBalance] = useState<string | null>('0.00');
    const [tokenUSDValue, setTokenUSDValue] = useState<string | null>(null);
    const [stakedBalance, setStakedBalance] = useState<any>('0.00');
    const [rewardsBalance, setRewardsBalance] = useState<string | null>('0.00');

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

    const setZkpTokenBalance = async () => {
        const stakingTokenContract =
            await stakingService.getStakingTokenContract(library);
        if (!stakingTokenContract) {
            return;
        }
        const balance = await accountService.getTokenBalance(
            stakingTokenContract,
            account,
        );
        setTokenBalance(balance);
    };

    const getTokenMarketPrice = async () => {
        const price = await stakingService.getZKPMarketPrice();
        if (price && tokenBalance && Number(tokenBalance) > 0) {
            const tokenUSDValue: number = price * Number(tokenBalance);
            const formattedUSDValue = formatUSDPrice(tokenUSDValue.toString());
            setTokenUSDValue(formattedUSDValue);
        }
    };

    const getStakedZkpBalance = async () => {
        const stakingContract = await stakingService.getStakingContract(
            library,
        );
        const stakingTokenContract =
            await stakingService.getStakingTokenContract(library);
        if (!stakingContract || !stakingTokenContract) {
            return;
        }
        const stakedBalance = await stakingService.getTotalStaked(
            stakingContract,
            account,
        );
        const totalStaked = BigNumber.from(0);
        stakedBalance.map(item => totalStaked.add(item.amount));
        const decimals = await stakingTokenContract.decimals();
        const totalStakedValue = utils.formatUnits(totalStaked, decimals);
        setStakedBalance((+totalStakedValue).toFixed(2));
    };

    const getUnclaimedRewardsBalance = async () => {
        const rewardsMasterContract =
            await stakingService.getRewardsMasterContract(library);
        const stakingTokenContract =
            await stakingService.getStakingTokenContract(library);
        if (!rewardsMasterContract || !stakingTokenContract) {
            return;
        }
        const rewards = await stakingService.getRewardsBalance(
            rewardsMasterContract,
            stakingTokenContract,
            account,
        );
        setRewardsBalance(rewards);
    };

    useEffect(() => {
        if (library) {
            setZkpTokenBalance();
            getTokenMarketPrice();
            getStakedZkpBalance();
            getUnclaimedRewardsBalance();
        }
    });

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
                        <Grid item md={1} xs={12} />
                        <Grid item container spacing={2} md={10} xs={12}>
                            <Grid
                                item
                                xs={12}
                                md={5}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'start'}
                            >
                                <BalanceCard
                                    tokenBalance={tokenBalance}
                                    tokenUSDValue={tokenUSDValue}
                                    stakedBalance={stakedBalance}
                                    rewardsBalance={rewardsBalance}
                                />
                            </Grid>
                            <Grid
                                item
                                xs={12}
                                md={7}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                            >
                                <StakingCard
                                    tokenBalance={tokenBalance}
                                    stakedBalance={stakedBalance}
                                    rewardsBalance={rewardsBalance}
                                    setZkpTokenBalance={setZkpTokenBalance}
                                    getStakedZkpBalance={getStakedZkpBalance}
                                />
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
