import * as React from 'react';

import {IconButton, Box, Card, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import ethLogo from '../../images/eth-logo.svg';
import {useAppSelector} from '../../redux/hooks';
import {
    zkpTokenUSDMarketPriceSelector,
    zZkpTokenUSDMarketPriceSelector,
    prpUnclaimedRewardsSelector,
    zZkpUnclaimedRewardsSelector,
    zkpUnclaimedRewardsSelector,
} from '../../redux/slices/unclaimedStakesRewards';
import {
    zkpStakedBalanceSelector,
    zkpUSDStakedBalanceSelector,
} from '../../redux/slices/zkpStakedBalance';
import {Network, supportedNetworks} from '../../services/connectors';
import {chainHasAdvancedStaking} from '../../services/contracts';
import AccountBalance from '../Header/AccountBalance';

import AddressBalances from './AddressBalances';
import AddressWithSetting from './AddressWithSetting';
import UnstakedBalance from './UnstakedBalance';

import './styles.scss';

const BalanceCard = () => {
    const context = useWeb3React();

    const {account, chainId} = context;
    const currentNetwork: Network | null =
        context && chainId ? supportedNetworks[chainId] : null;
    const zkpStakedBalance = useAppSelector(zkpStakedBalanceSelector);
    const zkpStakedUSDValue = useAppSelector(zkpUSDStakedBalanceSelector);

    const zkpRewardBalance = useAppSelector(zkpUnclaimedRewardsSelector);
    const zkpRewardsUSDValue = useAppSelector(zkpTokenUSDMarketPriceSelector);

    const zZkpRewardBalance = useAppSelector(zZkpUnclaimedRewardsSelector);
    const zZkpRewardsUSDValue = useAppSelector(zZkpTokenUSDMarketPriceSelector);

    const prpRewardBalance = useAppSelector(prpUnclaimedRewardsSelector);

    return (
        <Box className="balance-card-holder">
            <Card className="balance-card">
                {account && (
                    <Box className="balance-card-address-holder">
                        <AddressWithSetting />
                        <Box className="address-and-balance-holder">
                            <Box>
                                <AccountBalance
                                    networkSymbol={currentNetwork?.symbol}
                                />
                            </Box>
                        </Box>
                    </Box>
                )}
                {!account && (
                    <div className="not-connected-balance-container">
                        <IconButton>
                            <img src={ethLogo} />
                        </IconButton>
                        <Typography
                            component="div"
                            className="token-balance balance-not-connected"
                        >
                            Connect wallet
                        </Typography>
                    </div>
                )}
                <UnstakedBalance />

                <AddressBalances
                    title={'Total Staked Balance:'}
                    balance={zkpStakedBalance}
                    rewardsTokenSymbol={'ZKP'}
                    amountUSD={zkpStakedUSDValue}
                />

                <AddressBalances
                    title={'Classic Reward Balance:'}
                    balance={zkpRewardBalance}
                    rewardsTokenSymbol={'ZKP'}
                    amountUSD={zkpRewardsUSDValue}
                />

                {chainHasAdvancedStaking(chainId) && (
                    <AddressBalances
                        title={'Advanced Staking Reward Balance:'}
                        balance={zZkpRewardBalance}
                        rewardsTokenSymbol={'zZKP'}
                        amountUSD={zZkpRewardsUSDValue}
                    />
                )}

                {chainHasAdvancedStaking(chainId) && (
                    <AddressBalances
                        title={'Privacy Reward Points Balance:'}
                        balance={prpRewardBalance}
                        rewardsTokenSymbol={'PRP'}
                    />
                )}
            </Card>
        </Box>
    );
};

export default BalanceCard;
