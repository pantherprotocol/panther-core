import * as React from 'react';

import {Box, Typography} from '@mui/material';
import {BigNumber} from 'ethers';

import {useAppSelector} from '../../../redux/hooks';
import {totalSelector} from '../../../redux/slices/advancedStakesRewards';
import {marketPriceSelector} from '../../../redux/slices/zkpMarketPrice';
import {StakingRewardTokenID} from '../../../types/staking';
import {formatCurrency, formatUSD, fiatPrice} from '../../../utils/helpers';

import './styles.scss';

export default function PrivateBalance() {
    const zkpPrice = useAppSelector(marketPriceSelector);
    const unclaimedZZKP = useAppSelector(
        totalSelector(StakingRewardTokenID.zZKP),
    );
    const totalPrice = zkpPrice
        ? fiatPrice(unclaimedZZKP, BigNumber.from(zkpPrice))
        : 0;

    const unclaimedPRP = useAppSelector(
        totalSelector(StakingRewardTokenID.zZKP),
    );

    return (
        <Box className="private-zAssets-balance-container">
            <Box className="private-zAssets-balance">
                <Typography className="title">
                    Private zAsset Balance
                </Typography>
                <Typography className="amount">
                    {totalPrice ? formatUSD(totalPrice, {decimals: 2}) : '-'}
                </Typography>
                <Typography className="zkp-rewards">
                    {unclaimedPRP ? formatCurrency(unclaimedPRP) : '-'} Total
                    Privacy Reward Points (PRP)
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
