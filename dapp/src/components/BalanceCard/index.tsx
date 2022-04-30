import * as React from 'react';

import {IconButton, Box, Card, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import ethLogo from '../../images/eth-logo.svg';
import {useAppSelector} from '../../redux/hooks';
import {
    unclaimedRewardsSelector,
    zkpTokenUSDMarketPriceSelector,
} from '../../redux/slices/unclaimedRewards';
import {
    zkpStakedBalanceSelector,
    zkpUSDStakedBalanceSelector,
} from '../../redux/slices/zkpStakedBalance';

import AddressBalances from './AddressBalances';
import AddressWithSetting from './AddressWithSetting';
import UnstakedBalance from './UnstakedBalance';

import './styles.scss';

const BalanceCard = () => {
    const context = useWeb3React();
    const {account} = context;
    const stakedBalance = useAppSelector(zkpStakedBalanceSelector);
    const stakedUSDValue = useAppSelector(zkpUSDStakedBalanceSelector);
    const rewardsUSDValue = useAppSelector(zkpTokenUSDMarketPriceSelector);
    const rewardBalance = useAppSelector(unclaimedRewardsSelector);

    return (
        <Box className="balance-card-holder">
            <Card className="balance-card">
                {account && <AddressWithSetting />}
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
                    title={'Staked Balance'}
                    tooltip={'This is the total amount you have staked so far.'}
                    balance={stakedBalance}
                    amountUSD={stakedUSDValue}
                />

                <AddressBalances
                    title={'Unclaimed Reward Balance'}
                    balance={rewardBalance}
                    amountUSD={rewardsUSDValue}
                />
            </Card>
        </Box>
    );
};

export default BalanceCard;
