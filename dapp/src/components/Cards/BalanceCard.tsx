import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import './styles.scss';
import Divider from '@mui/material/Divider';
import {useEffect, useState} from 'react';
import {useWeb3React} from '@web3-react/core';
import {BigNumber, utils} from 'ethers';
import * as stakingService from '../../services/staking';
import * as accountService from '../../services/account';

export const BalanceCard = () => {
    const context = useWeb3React();
    const {account, library} = context;
    const [tokenBalance, setTokenBalance] = useState<string | null>(null);
    const [stakedBalance, setStakedBalance] = useState<any>(null);
    const [rewardsBalance, setRewardsBalance] = useState<string | null>(null);
    const [tokenMarketPrice, setTokenMarketPrice] = useState<number | null>(
        null,
    );

    const setZkpTokenBalance = async () => {
        const stakingTokenContract =
            await stakingService.getStakingTokenContract(library);
        const balance = await accountService.getTokenBalance(
            stakingTokenContract,
            account,
        );
        setTokenBalance(balance);
    };

    const getStakedZkpBalance = async () => {
        const stakingContract = await stakingService.getStakingContract(
            library,
        );
        const stakingTokenContract =
            await stakingService.getStakingTokenContract(library);
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
        const rewards = await stakingService.getRewardsBalance(
            rewardsMasterContract,
            stakingTokenContract,
            account,
        );
        setRewardsBalance(rewards);
    };

    const getTokenMarketPrice = async () => {
        const price = await stakingService.getZKPMarketPrice();
        setTokenMarketPrice(price);
    };

    useEffect(() => {
        setZkpTokenBalance();
        getStakedZkpBalance();
        getUnclaimedRewardsBalance();
        getTokenMarketPrice();
    });

    return (
        <Card
            sx={{
                marginBottom: '20px',
                border: '1px solid #485267',
                backgroundColor: '#2B334140',
                borderRadius: '8px',
            }}
        >
            <Box display="flex" alignItems="baseline">
                <Typography
                    sx={{
                        fontWeight: 800,
                        fontStyle: 'normal',
                        fontSize: '18px',
                        lineHeight: '42px',
                        alignItems: 'left',
                    }}
                >
                    Total Balance
                </Typography>
            </Box>

            <Box display="flex" alignItems="baseline">
                <Typography
                    component="div"
                    sx={{
                        fontWeight: 800,
                        fontStyle: 'bold',
                        fontSize: '32px',
                        lineHeight: '42px',
                    }}
                >
                    {tokenBalance}
                </Typography>
                <Typography
                    sx={{
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '12px',
                        lineHeight: '42px',
                        marginLeft: '8px',
                    }}
                >
                    ZKP
                </Typography>
            </Box>
            {tokenMarketPrice && (
                <Box display="flex" alignItems="baseline">
                    <Typography
                        sx={{
                            fontWeight: 400,
                            fontStyle: 'normal',
                            fontSize: '12px',
                            lineHeight: '42px',
                            opacity: 0.5,
                            marginBottom: '18px',
                        }}
                    >
                        Approximately ${tokenMarketPrice}
                    </Typography>
                </Box>
            )}
            <Divider
                sx={{
                    margin: '18px 0',
                    backgroundColor: '#485267',
                }}
            />
            <Box display="flex" alignItems="baseline">
                <Typography
                    sx={{
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '42px',
                        opacity: 0.5,
                        marginRight: '18px',
                    }}
                >
                    Staked Balance
                </Typography>
                <Typography>
                    <ErrorOutlineIcon
                        fontSize="small"
                        className="error-outline"
                        sx={{
                            opacity: 0.5,
                        }}
                    />
                </Typography>
            </Box>
            <Box display="flex" alignItems="baseline">
                <Typography
                    component="div"
                    sx={{
                        fontWeight: 800,
                        fontStyle: 'bold',
                        fontSize: '22px',
                        lineHeight: '42px',
                    }}
                >
                    {stakedBalance}
                </Typography>
                <Typography
                    sx={{
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '12px',
                        lineHeight: '42px',
                        marginLeft: '8px',
                    }}
                >
                    ZKP
                </Typography>
            </Box>
            <Box display="flex" alignItems="baseline">
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontStyle: 'normal',
                        fontSize: '16px',
                        lineHeight: '42px',
                        marginRight: '18px',
                        opacity: 0.5,
                    }}
                >
                    Unclaim Reward balance
                </Typography>
                <Typography>
                    <ErrorOutlineIcon
                        fontSize="small"
                        className="error-outline"
                        sx={{
                            opacity: 0.5,
                        }}
                    />
                </Typography>
            </Box>
            <Box display="flex" alignItems="baseline">
                <Typography
                    component="div"
                    sx={{
                        fontWeight: 800,
                        fontStyle: 'bold',
                        fontSize: '22px',
                        lineHeight: '42px',
                    }}
                >
                    {rewardsBalance}
                </Typography>
                <Typography
                    sx={{
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '12px',
                        lineHeight: '42px',
                        marginLeft: '8px',
                    }}
                >
                    ZKP
                </Typography>
            </Box>
        </Card>
    );
};

export const PrivateStakingComingSoonCard = () => {
    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: '10px',
                border: '1px solid #485267',
                background: '#2B334140',
            }}
        >
            <Box display="flex" alignItems="baseline">
                <Typography
                    sx={{
                        fontWeight: 800,
                        fontStyle: 'normal',
                        fontSize: '18px',
                        lineHeight: '42px',
                        alignItems: 'left',
                    }}
                >
                    Private Staking Coming Soon
                </Typography>
            </Box>
            <Box display="flex" alignItems="baseline">
                <Typography
                    sx={{
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '22px',
                        opacity: 0.5,
                        marginBottom: '18px',
                        textAlign: 'left',
                    }}
                >
                    Advance incetivized ZKP private staking is coming in March.
                </Typography>
            </Box>
        </Card>
    );
};

export default function OutlinedCard() {
    return (
        <Box width={'100%'} margin={'0 5'}>
            <BalanceCard />
            <PrivateStakingComingSoonCard />
        </Box>
    );
}
