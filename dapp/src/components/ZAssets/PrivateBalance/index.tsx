import * as React from 'react';

import {Box, Typography} from '@mui/material';

import {useAppSelector} from '../../../redux/hooks';
import {
    prpUnclaimedRewardsSelector,
    zZkpTokenUSDMarketPriceSelector,
} from '../../../redux/slices/unclaimedStakesRewards';
import {formatCurrency, formatUSD} from '../../../utils/helpers';

import './styles.scss';

export default function PrivateBalance() {
    const zZkpRewardsUSDValue = useAppSelector(zZkpTokenUSDMarketPriceSelector);
    const prpRewardBalance = useAppSelector(prpUnclaimedRewardsSelector);

    return (
        <Box className="private-zAssets-balance-container">
            <Box className="private-zAssets-balance">
                <Typography className="title">
                    Private zAsset Balance
                </Typography>
                <Typography className="amount">
                    {zZkpRewardsUSDValue
                        ? formatUSD(zZkpRewardsUSDValue, {decimals: 2})
                        : '-'}
                </Typography>
                <Typography className="zkp-rewards">
                    {prpRewardBalance ? formatCurrency(prpRewardBalance) : '-'}{' '}
                    Total Privacy Reward Points (PRP)
                </Typography>
            </Box>
            {/* <Box>
                <Link to={'/'}>
                    {' '}
                    <Button variant="contained" className="deposit-button">
                        <span>Deposit Assets</span>
                    </Button>
                </Link>
            </Box> */}
        </Box>
    );
}
