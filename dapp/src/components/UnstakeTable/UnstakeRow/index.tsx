// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {Box, IconButton, Tooltip, Typography} from '@mui/material';
import ExactValueTooltip from 'components/Common/ExactValueTooltip';
import {expectedPrpBalanceTooltip} from 'components/Common/tooltips';
import UnstakeButton from 'components/UnstakeTable/UnstakeButton';
import {format} from 'date-fns';
import {BigNumber, constants, utils} from 'ethers';
import useScreenSize from 'hooks/screen';
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

    const {isSmall, isMobile, isMedium} = useScreenSize();

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
                                <Typography component={'span'}>
                                    <>
                                        <span className="whole">
                                            {whole || 0}
                                        </span>

                                        <span className="substring">
                                            .{fractional || '00'}
                                        </span>
                                    </>
                                </Typography>
                            </ExactValueTooltip>

                            <Typography className="symbol" component={'span'}>
                                ZKP
                            </Typography>
                        </Box>
                        <UnstakeButton
                            row={row}
                            chainId={chainId}
                            unstakeById={unstakeById}
                        />
                    </Box>
                    <Box className="info-wrapper">
                        <Box
                            className={`info ${
                                row.unstakable ? 'unstakable' : ''
                            }`}
                        >
                            <span className="title">Stake Date:</span>
                            <Typography className="value" component={'span'}>
                                {isMedium && !isMobile
                                    ? format(
                                          new Date(row.stakedAt * 1000),
                                          'M/d/yyyy',
                                      )
                                    : format(
                                          new Date(row.stakedAt * 1000),
                                          'MMM dd, yyyy',
                                      )}
                            </Typography>
                        </Box>
                        {!row.unstakable && (
                            <Box className="info">
                                <span className="title">
                                    {isSmall ? 'Unlock:' : 'Unlock Date:'}
                                </span>
                                <Typography
                                    className="value"
                                    component={'span'}
                                >
                                    {isMedium && !isMobile
                                        ? format(
                                              new Date(row.lockedTill * 1000),
                                              'M/d/yyyy',
                                          )
                                        : formatTime(row.lockedTill * 1000, {
                                              style: 'short',
                                          })}
                                </Typography>
                            </Box>
                        )}
                        <Box
                            className={`info ${
                                row.unstakable ? 'unstakable' : ''
                            }`}
                        >
                            <span className="title">Earned:</span>
                            <Typography className="value" component={'span'}>
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
                                <Typography
                                    className="symbol"
                                    component={'span'}
                                >
                                    {row.stakeType === CLASSIC_TYPE_HEX
                                        ? 'ZKP'
                                        : 'zZKP'}
                                </Typography>
                            </Typography>
                        </Box>
                        <Box
                            className={`info ${
                                row.unstakable ? 'unstakable' : ''
                            }`}
                        >
                            <span
                                className={`title ${
                                    row.unstakable ? 'unstakable' : ''
                                }`}
                            >
                                Expected:
                            </span>
                            <Tooltip
                                title={expectedPrpBalanceTooltip}
                                data-html="true"
                                placement="top"
                                className={`tooltip-icon ${
                                    row.unstakable ? 'unstakable' : ''
                                }`}
                            >
                                <IconButton>
                                    <img src={infoIcon} />
                                </IconButton>
                            </Tooltip>

                            <Typography
                                component={'span'}
                                className={`value ${
                                    row.unstakable ? 'unstakable' : ''
                                }`}
                            >
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

                                <Typography
                                    className="symbol"
                                    component={'span'}
                                >
                                    PRP
                                </Typography>
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}
        </React.Fragment>
    );
};

export default UnstakeRow;
