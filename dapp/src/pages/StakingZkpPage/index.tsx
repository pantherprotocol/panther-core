import React, {useCallback, useEffect, useState} from 'react';

import {BigNumber} from '@ethersproject/bignumber';
import {Web3Provider} from '@ethersproject/providers';
import {Container} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import {Box} from '@mui/system';
import {useWeb3React} from '@web3-react/core';
import {utils} from 'ethers';

import AdvancedStakingComingSoon from '../../components/AdvancedStakingComingSoon';
import BalanceCard from '../../components/BalanceCard';
import CurrentStakeAPY from '../../components/CurrentStakeAPY';
import {Footer} from '../../components/Footer';
import Header from '../../components/Header';
import StakingUnstakingCard from '../../components/StakingUnstakingCard';
import {useEagerConnect, useInactiveListener} from '../../hooks/web3';
import background from '../../images/background.png';
import * as accountService from '../../services/account';
import {
    formatTokenBalance,
    formatUSDPrice,
    formatAccountAddress,
} from '../../services/account';
import {injected} from '../../services/connectors';
import * as stakingService from '../../services/staking';
import {
    getAccountStakes,
    getRewardsBalanceForCalculations,
} from '../../services/staking';
import {switchNetwork} from '../../services/wallet';

import './styles.scss';

const E18 = BigNumber.from(10).pow(18);

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
    const [tokenBalance, setTokenBalance] = useState<string | null>(null);
    const [tokenBalanceUSD, setTokenBalanceUSD] = useState<string | null>(null);
    const [pricePerToken, setPricePerToken] = useState<number | null>(null);
    const [stakedBalance, setStakedBalance] = useState<any>(null);
    const [rewardsBalance, setRewardsBalance] = useState<string | null>(null);
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

    const getTokenMarketPrice = useCallback(async balance => {
        const price = await stakingService.getZKPMarketPrice();
        if (price && balance && Number(balance) >= 0) {
            setPricePerToken(price);
            const tokenBalanceUSD: number = price * Number(balance);
            const formattedUSDValue = formatUSDPrice(
                tokenBalanceUSD.toString(),
            );
            setTokenBalanceUSD(formattedUSDValue);
        }
    }, []);

    const setZkpTokenBalance = useCallback(async () => {
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
        getTokenMarketPrice(balance);
    }, [account, library, getTokenMarketPrice]);

    const getStakedZkpBalance = useCallback(async () => {
        const stakingContract = await stakingService.getStakingContract(
            library,
        );
        const stakingTokenContract =
            await stakingService.getStakingTokenContract(library);
        if (!stakingContract || !stakingTokenContract) {
            return;
        }
        const stakedBalance = await stakingService.getAccountStakes(
            stakingContract,
            account,
        );
        let totalStaked = BigNumber.from(0);
        stakedBalance.map(item => {
            if (item.claimedAt == 0) {
                totalStaked = totalStaked.add(item.amount);
                return totalStaked;
            }
        });
        const decimals = await stakingTokenContract.decimals();
        const totalStakedValue = utils.formatUnits(totalStaked, decimals);
        setStakedBalance((+totalStakedValue).toFixed(2));
    }, [account, library]);

    const getUnclaimedRewardsBalance = useCallback(async () => {
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

        const rewardsBalanceNumber = await getRewardsBalanceForCalculations(
            rewardsMasterContract,
            stakingTokenContract,
            account,
        );
        if (!rewardsBalanceNumber) return;

        const decimals = await stakingTokenContract.decimals();

        const stakedData = await getAccountStakes(stakingContract, account);

        let totalStaked = BigNumber.from(0);
        stakedData.map(item => {
            totalStaked = totalStaked.add(item.amount);
            return totalStaked;
        });

        let totalRewards = BigNumber.from(0);
        stakedData.map(item => {
            if (item.claimedAt == 0) {
                const calculatedReward = rewardsBalanceNumber
                    .mul(item.amount)
                    .div(totalStaked);
                if (!calculatedReward) return;
                totalRewards = totalRewards.add(calculatedReward);
                return totalRewards;
            }
        });
        setRewardsBalance(formatTokenBalance(totalRewards, decimals));
    }, [account, library]);

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
        console.log('Total ZKP staked:', utils.formatEther(totalStaked));

        const rewardsAvailable = BigNumber.from('6650000').mul(E18);
        const annualRewards = rewardsAvailable.mul(365).div(91);
        console.log('Annual rewards', utils.formatEther(annualRewards));

        // Calculate as a percentage with 2 digits of precision
        const APY = Number(annualRewards.mul(10000).div(totalStaked)) / 100;
        setCurrentAPY(APY);
        console.log(`Calculated APY as ${APY}%`);
    }, [library]);

    useEffect(() => {
        if (!library) {
            // Wallet not connected yet
            return;
        }
        getAPY();
    }, [library, getAPY]);

    useEffect(() => {
        if (!library || !account) {
            return;
        }

        setZkpTokenBalance();
        getStakedZkpBalance();
        getUnclaimedRewardsBalance();
    }, [
        library,
        account,
        setZkpTokenBalance,
        getStakedZkpBalance,
        getUnclaimedRewardsBalance,
    ]);

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
                                        setZkpTokenBalance={setZkpTokenBalance}
                                        getStakedZkpBalance={
                                            getStakedZkpBalance
                                        }
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
