import * as React from 'react';

import {Box, IconButton, Tooltip, Typography} from '@mui/material';

import infoIcon from '../../../images/info-icon.svg';
import {useAppSelector} from '../../../redux/hooks';
import {
    zkpTokenBalanceSelector,
    zkpUnstakedUSDMarketPriceSelector,
} from '../../../redux/slices/zkpTokenBalance';
import {formatCurrency} from '../../../utils/helpers';

import './styles.scss';

export default function UnstakedBalance() {
    const tokenBalance = useAppSelector(zkpTokenBalanceSelector);
    const tokenMarketPrice = useAppSelector(zkpUnstakedUSDMarketPriceSelector);

    return (
        <Box className="total-balance">
            <Box className="title-box">
                <Typography className="title">Unstaked Balance</Typography>
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
                            ? `~$ ${formatCurrency(tokenMarketPrice)} USD`
                            : '-'}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
