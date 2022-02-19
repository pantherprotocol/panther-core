import React, {useCallback, useEffect, useState} from 'react';

import {BigNumber} from '@ethersproject/bignumber';
import {Web3Provider} from '@ethersproject/providers';
import {Container} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import {Box} from '@mui/system';
import {useWeb3React} from '@web3-react/core';
import {constants} from 'ethers';

import AdvancedStakingComingSoon from '../../components/AdvancedStakingComingSoon';
import BalanceCard from '../../components/BalanceCard';
import CurrentStakeAPY from '../../components/CurrentStakeAPY';
import {Footer} from '../../components/Footer';
import Header from '../../components/Header';
import StakingUnstakingCard from '../../components/StakingUnstakingCard';
import {useEagerConnect, useInactiveListener} from '../../hooks/web3';
import background from '../../images/background.png';
import * as accountService from '../../services/account';
import {formatAccountAddress} from '../../services/account';
import {injected} from '../../services/connectors';
import * as stakingService from '../../services/staking';
import {switchNetwork} from '../../services/wallet';
import {
    fiatPrice,
    formatCurrency,
    formatEther,
    percentFormat,
    E18,
} from '../../utils';

import './styles.scss';

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
    const [tokenBalance, setTokenBalance] = useState<BigNumber | null>(null);
    const [tokenBalanceUSD, setTokenBalanceUSD] = useState<BigNumber | null>(
        null,
    );
    const [pricePerToken, setPricePerToken] = useState<BigNumber | null>(null);
    const [stakedBalance, setStakedBalance] = useState<BigNumber | null>(null);
    const [rewardsBalance, setRewardsBalance] = useState<BigNumber | null>(
        null,
    );
    const [currentAPY, setCurrentAPY] = useState<number | null>(null);

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
            setTokenBalance(null);
            setStakedBalance(null);
            setRewardsBalance(null);
        }
    }, [active, chainId, deactivate]);

    const fetchTokenMarketPrice = useCallback(async () => {
        const price = await stakingService.getZKPMarketPrice();
        if (price) {
            setPricePerToken(price);
        }
        console.debug(`Fetched $ZKP market price: \$${formatEther(price)}`);
        return price;
    }, []);

    const fetchZkpTokenBalance = useCallback(
        async (price: BigNumber | null) => {
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

            let tokenBalanceUSD: BigNumber | null = null;
            if (price && balance && balance.gte(constants.Zero)) {
                tokenBalanceUSD = fiatPrice(balance, price);
                setTokenBalanceUSD(tokenBalanceUSD);
            }
            console.debug(
                'tokenBalance:',
                formatEther(balance),
                `(USD \$${formatCurrency(tokenBalanceUSD)})`,
            );
        },
        [account, library],
    );

    const fetchStakedZkpBalance = useCallback(
        async (price: BigNumber | null) => {
            if (!account) return;
            const stakingContract = await stakingService.getStakingContract(
                library,
            );
            const stakingTokenContract =
                await stakingService.getStakingTokenContract(library);
            if (!stakingContract || !stakingTokenContract) {
                return;
            }
            const totalStaked = await stakingService.getTotalStakedForAccount(
                stakingContract,
                account,
            );
            setStakedBalance(totalStaked);
            console.debug(
                'stakedBalance:',
                formatCurrency(totalStaked),
                `(USD \$${formatCurrency(fiatPrice(totalStaked, price))})`,
            );
        },
        [account, library],
    );

    const getUnclaimedRewardsBalance = useCallback(
        async (price: BigNumber | null) => {
            if (!account) return;
            const stakingContract = await stakingService.getStakingContract(
                library,
            );
            if (!stakingContract) {
                return;
            }

            const stakingTokenContract =
                await stakingService.getStakingTokenContract(library);
            if (!stakingTokenContract) {
                return;
            }

            const rewardsMasterContract =
                await stakingService.getRewardsMasterContract(library);
            if (!rewardsMasterContract) {
                return;
            }

            const rewardsBalance = await stakingService.getRewardsBalance(
                rewardsMasterContract,
                account,
            );
            if (!rewardsBalance) return;
            setRewardsBalance(rewardsBalance);
            console.debug(
                'rewardsBalance:',
                formatCurrency(rewardsBalance),
                `(USD \$${formatCurrency(fiatPrice(rewardsBalance, price))})`,
            );
        },
        [account, library],
    );

    const getAPY = useCallback(async () => {
        const stakingContract = await stakingService.getStakingContract(
            library,
        );
        if (!stakingContract) {
            return;
        }
        const totalStaked = await stakingService.getTotalStaked(
            stakingContract,
        );
        if (!totalStaked || totalStaked instanceof Error) {
            return;
        }
        console.log('Total ZKP staked:', formatCurrency(totalStaked));

        const rewardsAvailable = BigNumber.from('6650000').mul(E18);
        const annualRewards = rewardsAvailable.mul(365).div(91);
        console.log('Annual rewards', formatCurrency(annualRewards));

        // Calculate as a percentage with healthy dose of precision
        const APY = totalStaked.gt(constants.Zero)
            ? Number(annualRewards.mul(10000000).div(totalStaked)) / 10000000
            : 0;
        setCurrentAPY(APY);
        console.log('Calculated APY as', APY, percentFormat.format(APY));
    }, [library]);

    useEffect(() => {
        if (!library) {
            // Wallet not connected yet
            return;
        }
        getAPY();
    }, [library, getAPY]);

    const fetchData = useCallback(async (): Promise<void> => {
        if (!library || !account) {
            return;
        }
        const price = await fetchTokenMarketPrice();
        await fetchZkpTokenBalance(price);
        await fetchStakedZkpBalance(price);
        await getUnclaimedRewardsBalance(price);
    }, [
        library,
        account,
        fetchTokenMarketPrice,
        fetchZkpTokenBalance,
        fetchStakedZkpBalance,
        getUnclaimedRewardsBalance,
    ]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const accountAddress = formatAccountAddress(account) || null;

    return (
        <Box
            className="main-app"
            sx={{
                backgroundImage: `url(${background})`,
            }}
        >
            <CssBaseline />

            <Header
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

            <Box className="main-box-holder">
                <Container className="main-container">
                    <Grid container>
                        <Grid item md={1} xs={12} />
                        <Grid item container spacing={2} md={10} xs={12}>
                            <Grid item xs={12} md={5}>
                                <Box width={'100%'}>
                                    <BalanceCard
                                        tokenBalance={tokenBalance}
                                        tokenBalanceUSD={tokenBalanceUSD}
                                        pricePerToken={pricePerToken}
                                        stakedBalance={stakedBalance}
                                        rewardsBalance={rewardsBalance}
                                        accountAddress={accountAddress}
                                    />
                                    <AdvancedStakingComingSoon />
                                </Box>
                                <Footer />
                            </Grid>
                            <Grid item xs={12} md={7}>
                                <Box width={'100%'}>
                                    <CurrentStakeAPY currentAPY={currentAPY} />
                                    <StakingUnstakingCard
                                        tokenBalance={tokenBalance}
                                        stakedBalance={stakedBalance}
                                        rewardsBalance={rewardsBalance}
                                        fetchData={fetchData}
                                        onConnect={() => {
                                            onConnect();
                                        }}
                                        switchNetwork={() => {
                                            switchNetwork(setChainError);
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
