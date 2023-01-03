// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {IconButton, Tooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ExactValueTooltip from 'components/common/ExactValueTooltip';
import StyledBalance from 'components/common/StyledBalance';
import {BigNumber, utils} from 'ethers';
import infoIcon from 'images/info-icon.svg';
import {formatUSD, getFormattedFractions} from 'lib/format';

import './styles.scss';

export default function AddressBalances(props: {
    title: string;
    rewardsTokenSymbol: string;
    balance: BigNumber | null;
    scale?: number;
    amountUSD?: BigNumber | null;
    redeem?: () => void;
    tooltip?: string;
}) {
    const {title, tooltip, amountUSD, balance, rewardsTokenSymbol} = props;
    const [wholePart, fractionalPart] = balance
        ? getFormattedFractions(utils.formatEther(balance))
        : [];
    return (
        <Box className="address-balance">
            <Box className="title-box">
                <Typography className="title">{title}</Typography>
                <Typography>
                    {tooltip && (
                        <Tooltip title={tooltip} placement="top">
                            <IconButton>
                                <img src={infoIcon} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Typography>
            </Box>

            <Box className="amount-box">
                <Box className="balance-box">
                    <ExactValueTooltip
                        balance={props.scale !== 0 ? balance : null}
                    >
                        <Typography component="div">
                            <StyledBalance
                                wholePart={wholePart}
                                fractionalPart={fractionalPart}
                            />
                        </Typography>
                    </ExactValueTooltip>

                    <Typography className="zkp-symbol">
                        {rewardsTokenSymbol}
                    </Typography>
                </Box>

                {props.redeem ? (
                    // TODO:add implementation for PRP redeeming
                    // <SmallButton onClick={props.redeem} text={'Redeem'} />
                    <></>
                ) : (
                    <Typography className="amount-usd">
                        {`~${
                            amountUSD
                                ? formatUSD(amountUSD)
                                : formatUSD(BigNumber.from('0'), {decimals: 2})
                        }`}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
