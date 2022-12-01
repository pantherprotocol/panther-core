// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {TableCell, TableRow, Typography} from '@mui/material';
import ExactValueTooltip from 'components/Common/ExactValueTooltip';
import UnstakeButton from 'components/UnstakeTable/UnstakeButton';
import {BigNumber, constants, utils} from 'ethers';
import {formatCurrency, formatTime} from 'lib/format';
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

    return (
        <React.Fragment key={row.stakedAt}>
            {row.claimedAt === 0 && (
                <TableRow
                    className="unstake-row-holder"
                    sx={{
                        '&:last-child td, &:last-child th': {
                            border: 0,
                        },
                    }}
                >
                    <TableCell
                        align="center"
                        className="unstake-row-description"
                    >
                        <Typography className="title">
                            {row.stakeType === CLASSIC_TYPE_HEX
                                ? 'Classic Staking'
                                : 'Advanced Staking'}
                        </Typography>
                        <Typography className="date">
                            {formatTime(row.stakedAt * 1000)}
                        </Typography>
                    </TableCell>

                    <TableCell align="left">
                        <ExactValueTooltip balance={row.amount}>
                            <Typography>
                                {formatCurrency(row.amount, {
                                    decimals: 2,
                                })}{' '}
                            </Typography>
                        </ExactValueTooltip>

                        <Typography>ZKP</Typography>
                    </TableCell>
                    <TableCell align="left">
                        <ExactValueTooltip
                            balance={getRewards(row, StakingRewardTokenID.zZKP)}
                        >
                            <Typography>
                                {formatCurrency(
                                    getRewards(row, StakingRewardTokenID.zZKP),
                                )}
                            </Typography>
                        </ExactValueTooltip>

                        <Typography>
                            {row.stakeType === CLASSIC_TYPE_HEX
                                ? 'ZKP'
                                : 'zZKP'}
                        </Typography>
                    </TableCell>
                    <TableCell align="left" className="prp">
                        <span className="plus">+</span>
                        <span className="amount-box">
                            <span className="amount">
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
                            </span>
                            <span>PRP</span>
                        </span>
                    </TableCell>
                    <TableCell align="left" className="unstake">
                        <UnstakeButton
                            row={row}
                            chainId={chainId}
                            unstakeById={unstakeById}
                        />
                    </TableCell>
                </TableRow>
            )}
        </React.Fragment>
    );
};

export default UnstakeRow;
