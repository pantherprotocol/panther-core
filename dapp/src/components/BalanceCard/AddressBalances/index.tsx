// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {DECIMALS} from 'constants/numbers';

import {IconButton, Tooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ExactValueTooltip from 'components/Common/ExactValueTooltip';
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
    const [whole, fractional] = balance
        ? getFormattedFractions(
              utils.formatUnits(balance, props.scale ?? DECIMALS),
          )
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
                        <Typography
                            className={`balance ${
                                title === 'Expected PRP Balance:' &&
                                'expected-prp-balance'
                            }`}
                            component="div"
                        >
                            {whole && fractional ? (
                                <>
                                    <span>{whole}</span>
                                    {
                                        //only PRPs have no scale
                                        props.scale !== 0 && (
                                            <span className="substring">
                                                .{fractional}
                                            </span>
                                        )
                                    }
                                </>
                            ) : (
                                '0.00'
                            )}
                        </Typography>
                    </ExactValueTooltip>

                    <Typography
                        className={`zkp-symbol ${
                            title === 'Expected PRP Balance:' &&
                            'expected-prp-balance'
                        }`}
                    >
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
