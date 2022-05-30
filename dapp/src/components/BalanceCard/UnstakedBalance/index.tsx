import * as React from 'react';

import {Box, IconButton, Tooltip, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import infoIcon from '../../../images/info-icon.svg';
import refreshIcon from '../../../images/refresh-icon.svg';
import {useAppDispatch, useAppSelector} from '../../../redux/hooks';
import {
    getZkpTokenBalance,
    zkpTokenBalanceSelector,
    zkpUnstakedUSDMarketPriceSelector,
} from '../../../redux/slices/zkpTokenBalance';
import {formatCurrency, formatUSD} from '../../../utils/helpers';

import './styles.scss';

export default function UnstakedBalance() {
    const context = useWeb3React();
    const dispatch = useAppDispatch();
    const tokenBalance = useAppSelector(zkpTokenBalanceSelector);
    const tokenMarketPrice = useAppSelector(zkpUnstakedUSDMarketPriceSelector);

    const refreshTokenBalance = () => {
        dispatch(getZkpTokenBalance, context);
    };

    return (
        <Box className="total-balance">
            <Box className="title-box">
                <Typography className="title">Total Balance</Typography>
                {false && (
                    <Tooltip
                        title="This is the amount of ZKP you have available for staking."
                        placement="top"
                    >
                        <IconButton>
                            <img src={infoIcon} />
                        </IconButton>
                    </Tooltip>
                )}
                <IconButton onClick={refreshTokenBalance}>
                    <img src={refreshIcon} />
                </IconButton>
            </Box>

            <Box className="amount-box">
                <Typography component="div" className="token-balance">
                    {tokenBalance ? formatCurrency(tokenBalance) : '-'}
                </Typography>
                <Typography className="zkp-symbol main-symbol">ZKP</Typography>
            </Box>
            {tokenMarketPrice && (
                <Box className="amount-box">
                    <Typography className="token-market-price">
                        {tokenMarketPrice
                            ? `~${formatUSD(tokenMarketPrice)}`
                            : '-'}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
