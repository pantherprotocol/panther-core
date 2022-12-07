// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {Box, IconButton, Tooltip, Typography} from '@mui/material';
import ExactValueTooltip from 'components/Common/ExactValueTooltip';
import {expectedPrpBalanceTooltip} from 'components/Common/tooltips';
import UnstakeButton from 'components/UnstakeTable/UnstakeButton';
import {format} from 'date-fns';
import {BigNumber, constants, utils} from 'ethers';
import infoIcon from 'images/info-icon.svg';
import {formatCurrency, formatTime, getFormattedFractions} from 'lib/format';
import {WalletActionTrigger} from 'redux/slices/ui/web3-wallet-last-action';
import {chainHasPoolContract} from 'services/contracts';
import {isClassic} from 'services/rewards';
import {CLASSIC_TYPE_HEX, StakeRow} from 'services/staking';
import {
    AdvancedStakeRewardsBN,
    ClassicStakeRewardBN,
    StakingRewardTokenID,
} from 'types/staking';

import './styles.scss';

function getRewards(
    row: StakeRow,
    rewardName: StakingRewardTokenID,
): BigNumber {
    return row.stakeType === CLASSIC_TYPE_HEX && isClassic(row.reward)
        ? (row.reward as ClassicStakeRewardBN)
        : rewardName === StakingRewardTokenID.PRP
        ? (row.reward as AdvancedStakeRewardsBN)[StakingRewardTokenID.PRP]
        : (row.reward as AdvancedStakeRewardsBN)[StakingRewardTokenID.zZKP];
}
const UnstakeRow = (props: {
    row: StakeRow;
    chainId: number | undefined;
    unstakeById: (id: any, trigger: WalletActionTrigger) => Promise<void>;
}) => {
    const {row, chainId, unstakeById} = props;

    const [whole, fractional] = row.amount
        ? getFormattedFractions(utils.formatEther(row.amount))
        : [];

    return (
        <React.Fragment key={row.stakedAt}>
            {row.claimedAt === 0 && (
                <Box className="unstake-row-holder">
                    <Box className="balance-wrapper">
                        <Box className="balance">
                            <ExactValueTooltip balance={row.amount}>
                                <Typography>
                                    {whole && fractional ? (
                                        <>
                                            <span className="whole">
                                                {whole}
                                            </span>

                                            <span className="substring">
                                                .{fractional}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span>0</span>

                                            <span className="substring">
                                                .00
                                            </span>
                                        </>
                                    )}
                                </Typography>
                            </ExactValueTooltip>

                            <Typography className="symbol">ZKP</Typography>
                        </Box>
                        <UnstakeButton
                            row={row}
                            chainId={chainId}
                            unstakeById={unstakeById}
                        />
                    </Box>
                    <Box className="info-wrapper">
                        <Box className="info">
                            <span className="title">Date:</span>
                            <Typography className="value">
                                {format(
                                    new Date(row.stakedAt * 1000),
                                    'MMM dd, yyyy',
                                )}
                            </Typography>
                        </Box>
                        <Box className="info">
                            <span className="title">Unlock Date:</span>
                            <Typography className="value">
                                {formatTime(row.lockedTill * 1000, {
                                    style: 'short',
                                })}
                            </Typography>
                        </Box>
                        <Box className="info">
                            <span className="title">Earned:</span>
                            <Typography className="value">
                                <ExactValueTooltip
                                    balance={getRewards(
                                        row,
                                        StakingRewardTokenID.zZKP,
                                    )}
                                >
                                    <Typography>
                                        {formatCurrency(
                                            getRewards(
                                                row,
                                                StakingRewardTokenID.zZKP,
                                            ),
                                        )}
                                    </Typography>
                                </ExactValueTooltip>
                                <Typography className="symbol">
                                    {row.stakeType === CLASSIC_TYPE_HEX
                                        ? 'ZKP'
                                        : 'zZKP'}
                                </Typography>
                            </Typography>
                        </Box>
                        <Box className="info">
                            <span className="title">Expected:</span>
                            <Tooltip
                                title={expectedPrpBalanceTooltip}
                                data-html="true"
                                placement="top"
                                className="tooltip-icon"
                            >
                                <IconButton>
                                    <img src={infoIcon} />
                                </IconButton>
                            </Tooltip>

                            <Typography className="value">
                                {chainId && chainHasPoolContract(chainId)
                                    ? utils.formatUnits(
                                          row.stakeType === CLASSIC_TYPE_HEX
                                              ? constants.Zero
                                              : getRewards(
                                                    row,
                                                    StakingRewardTokenID.PRP,
                                                ),
                                          0,
                                      )
                                    : '0'}

                                <Typography className="symbol">PRP</Typography>
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}
        </React.Fragment>
    );
};

export default UnstakeRow;
