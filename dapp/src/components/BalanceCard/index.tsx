// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {Box, Card} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {expectedPrpBalanceTooltip} from 'components/Common/tooltips';
import AccountBalance from 'components/Header/AccountBalance';
import {constants} from 'ethers';
import {fiatPrice} from 'lib/token-price';
import {useAppSelector} from 'redux/hooks';
import {zkpMarketPriceSelector} from 'redux/slices/marketPrices/zkp-market-price';
import {zkpStakedBalanceSelector} from 'redux/slices/staking/zkp-staked-balance';
import {totalSelector} from 'redux/slices/wallet/advanced-stakes-rewards';
import {
    isEthereumNetwork,
    Network,
    supportedNetworks,
} from 'services/connectors';
import {chainHasPoolContract} from 'services/contracts';
import {StakingRewardTokenID} from 'types/staking';

import AddressBalances from './AddressBalances';
import AddressWithSetting from './AddressWithSetting';
import UnstakedBalance from './UnstakedBalance';

import './styles.scss';

const BalanceCard = () => {
    const context = useWeb3React();
    const {account, chainId} = context;
    const currentNetwork: Network | null =
        context && chainId ? supportedNetworks[chainId] : null;

    const zkpPrice = useAppSelector(zkpMarketPriceSelector);

    const zkpStakedBalance = useAppSelector(zkpStakedBalanceSelector);
    const zkpStakedUSDValue = fiatPrice(zkpStakedBalance, zkpPrice);

    const zZkpRewardBalance = useAppSelector(
        totalSelector(chainId, account, StakingRewardTokenID.zZKP),
    );

    const zZkpRewardsUSDValue = fiatPrice(zZkpRewardBalance, zkpPrice);

    const prpRewardBalance = useAppSelector(
        totalSelector(chainId, account, StakingRewardTokenID.PRP, true),
    );

    return (
        <Box className="balance-card-holder" data-testid="balance-card_wrapper">
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
                    title={'Staked ZKP Balance:'}
                    balance={zkpStakedBalance}
                    rewardsTokenSymbol={'ZKP'}
                    amountUSD={
                        chainId && chainHasPoolContract(chainId)
                            ? zkpStakedUSDValue
                            : constants.Zero
                    }
                />

                {!isEthereumNetwork(chainId!) && (
                    <AddressBalances
                        title={'Reward Balance:'}
                        balance={
                            chainId && chainHasPoolContract(chainId)
                                ? zZkpRewardBalance
                                : constants.Zero
                        }
                        rewardsTokenSymbol={'zZKP'}
                        amountUSD={
                            chainId && chainHasPoolContract(chainId)
                                ? zZkpRewardsUSDValue
                                : constants.Zero
                        }
                    />
                )}

                {!isEthereumNetwork(chainId!) && (
                    <AddressBalances
                        title={'Expected PRP Balance:'}
                        balance={
                            chainId && chainHasPoolContract(chainId)
                                ? prpRewardBalance
                                : constants.Zero
                        }
                        scale={0}
                        rewardsTokenSymbol={'PRP'}
                        // TODO:add definition for redeem function
                        redeem={() => {
                            console.error('Not implemented');
                        }}
                        tooltip={expectedPrpBalanceTooltip}
                    />
                )}
            </Card>
        </Box>
    );
};

export default BalanceCard;
