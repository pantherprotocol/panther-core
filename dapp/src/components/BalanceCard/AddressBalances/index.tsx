import * as React from 'react';

import {IconButton, Tooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {BigNumber, utils} from 'ethers';

import infoIcon from '../../../images/info-icon.svg';
import {DECIMALS} from '../../../lib/constants';
import {formatUSD, getFormattedFractions} from '../../../lib/format';
import ExactValueTooltip from '../../Common/ExactValueTooltip';

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
                        <Typography className="balance" component="div">
                            {whole && fractional ? (
                                <>
                                    <span>{whole}</span>

                                    <span className="substring">
                                        .{fractional}
                                    </span>
                                </>
                            ) : (
                                '0.00'
                            )}
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
