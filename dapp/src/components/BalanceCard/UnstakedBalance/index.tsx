import * as React from 'react';

import {BigNumber} from '@ethersproject/bignumber';
import {Box, IconButton, Tooltip, Typography} from '@mui/material';

import infoIcon from '../../../images/info-icon.svg';
import {formatCurrency} from '../../../utils/helpers';

import './styles.scss';

export default function UnstakedBalance(props: {
    tokenBalance: BigNumber | null;
    tokenMarketPrice: BigNumber | null;
}) {
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
                    {props.tokenBalance
                        ? formatCurrency(props.tokenBalance)
                        : '-'}
                </Typography>
                <Typography className="zkp-symbol main-symbol">ZKP</Typography>
            </Box>
            {props.tokenMarketPrice && (
                <Box className="amount-box">
                    <Typography className="token-market-price">
                        {props.tokenMarketPrice
                            ? `~$ ${formatCurrency(props.tokenMarketPrice)} USD`
                            : '-'}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
