import React, {useCallback, useEffect, useState} from 'react';
import {Container} from '@mui/material';
import Grid from '@mui/material/Grid';
import {Box} from '@mui/system';
import CssBaseline from '@mui/material/CssBaseline';
import './styles.scss';
import BalanceCard from '../../components/BalanceCard';
import AdvancedStakingComingSoon from '../../components/AdvancedStakingComingSoon';
import StakingUnstakingCard from '../../components/StakingUnstakingCard';
import CurrentStakeAPY from '../../components/CurrentStakeAPY';
import background from '../../images/background.png';
import {Footer} from '../../components/Footer';
import {switchNetwork} from '../../services/wallet';
import {useEagerConnect, useInactiveListener} from '../../hooks/web3';
import {injected, requiredNetwork} from '../../services/connectors';
import {useWeb3React} from '@web3-react/core';
import {Web3Provider} from '@ethersproject/providers';
// import StakingHeader from '../../components/StakingHeader';
import Header from '../../components/Header';
import * as stakingService from '../../services/staking';
import * as accountService from '../../services/account';
import {BigNumber} from '@ethersproject/bignumber';
import {utils} from 'ethers';
import {formatTokenBalance, formatUSDPrice} from '../../services/account';
import {
    getAccountStakes,
    getRewardsBalanceForCalculations,
} from '../../services/staking';
import {formatAccountAddress} from '../../services/account';
import {formatAccountBalance} from '../../services/account';

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
    const [currentAPY] = useState<string>('');

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
    };

    const getUnclaimedRewardsBalance = async () => {
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
    };

    useEffect(() => {
        if (!library || !account) {
            return;
        }

        setZkpTokenBalance();
        getTokenMarketPrice();
        getStakedZkpBalance();
        getUnclaimedRewardsBalance();
    });

    const accountAddress = formatAccountAddress(account) || '-';

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

            {/* <StakingHeader
                onConnect={() => {
                    onConnect();
                }}
                switchNetwork={() => {
                    switchNetwork(setChainError);
                }}
                disconnect={() => {
                    disconnect();
                }}
            /> */}
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

            <Box
                sx={{
                    marginTop: '100px',
                }}
            >
                <Container className="main-container">
                    <Grid container>
                        <Grid item md={1} xs={12} />
                        <Grid item container spacing={2} md={10} xs={12}>
                            <Grid
                                item
                                xs={12}
                                md={5}
                                display={'flex'}
                                flexDirection={'column'}
                                justifyContent={'start'}
                                alignItems={'center'}
                            >
                                <Box width={'100%'}>
                                    <BalanceCard
                                        tokenBalance={tokenBalance}
                                        tokenUSDValue={tokenUSDValue}
                                        stakedBalance={stakedBalance}
                                        rewardsBalance={rewardsBalance}
                                        accountAddress={accountAddress}
                                    />
                                    <AdvancedStakingComingSoon />
                                </Box>
                            </Grid>
                            <Grid
                                item
                                xs={12}
                                md={7}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                            >
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
                                    />
                                    <Footer />
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
