import * as React from 'react';

import {Box, Card} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import {fiatPrice} from '../../lib/tokenPrice';
import {useAppSelector} from '../../redux/hooks';
import {totalSelector} from '../../redux/slices/advancedStakesRewards';
import {totalUnclaimedClassicRewardsSelector} from '../../redux/slices/totalUnclaimedClassicRewards';
import {marketPriceSelector} from '../../redux/slices/zkpMarketPrice';
import {zkpStakedBalanceSelector} from '../../redux/slices/zkpStakedBalance';
import {Network, supportedNetworks} from '../../services/connectors';
import {chainHasPoolContract} from '../../services/contracts';
import {StakingRewardTokenID} from '../../types/staking';
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

    const zkpPrice = useAppSelector(marketPriceSelector);

    const zkpStakedBalance = useAppSelector(zkpStakedBalanceSelector);
    const zkpStakedUSDValue = fiatPrice(zkpStakedBalance, zkpPrice);

    const zkpRewardBalance = useAppSelector(
        totalUnclaimedClassicRewardsSelector,
    );

    const zkpRewardsUSDValue = fiatPrice(zkpRewardBalance, zkpPrice);

    const zZkpRewardBalance = useAppSelector(
        totalSelector(chainId, account, StakingRewardTokenID.zZKP),
    );

    const zZkpRewardsUSDValue = fiatPrice(zZkpRewardBalance, zkpPrice);

    const prpRewardBalance = useAppSelector(
        totalSelector(chainId, account, StakingRewardTokenID.PRP, true),
    );

    return (
        <Box className="balance-card-holder">
            <Card className="balance-card">
                {account && (
                    <Box className="balance-card-address-holder">
                        <AddressWithSetting account={account} />
                        <AccountBalance
                            networkSymbol={currentNetwork?.symbol}
                        />
                    </Box>
                )}

                <UnstakedBalance />
                <AddressBalances
                    title={'Staked Balance:'}
                    balance={zkpStakedBalance}
                    rewardsTokenSymbol={'ZKP'}
                    amountUSD={zkpStakedUSDValue}
                />

                <AddressBalances
                    title={'Reward Balance:'}
                    balance={zkpRewardBalance}
                    rewardsTokenSymbol={'ZKP'}
                    amountUSD={zkpRewardsUSDValue}
                />

                {chainId && chainHasPoolContract(chainId) && (
                    <AddressBalances
                        title={'Advanced Staking Reward:'}
                        balance={zZkpRewardBalance}
                        rewardsTokenSymbol={'zZKP'}
                        amountUSD={zZkpRewardsUSDValue}
                    />
                )}

                {chainId && chainHasPoolContract(chainId) && (
                    <AddressBalances
                        title={'Privacy Reward Points:'}
                        balance={prpRewardBalance}
                        scale={0}
                        rewardsTokenSymbol={'PRP'}
                        // TODO:add definition for redeem function
                        redeem={() => {
                            console.error('Not implemented');
                        }}
                    />
                )}
            </Card>
        </Box>
    );
};

export default BalanceCard;
