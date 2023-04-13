// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {CLASSIC_TYPE_HEX} from 'constants/stake-terms';

import {Box, IconButton, Tooltip, Typography} from '@mui/material';
import {classnames} from 'components/common/classnames';
import ExactValueTooltip from 'components/common/ExactValueTooltip';
import StyledBalance from 'components/common/StyledBalance';
import {expectedPrpBalanceTooltip} from 'components/common/tooltips';
import UnstakeButton from 'components/StakeList/UnstakeButton';
import dayjs from 'dayjs';
import {BigNumber, constants, utils} from 'ethers';
import useScreenSize from 'hooks/screen';
import infoIcon from 'images/info-icon.svg';
import {formatCurrency, getFormattedFractions} from 'lib/format';
import {isClassic} from 'services/rewards';
import {StakeRow} from 'services/staking';
import {
    AdvancedStakeRewardsBN,
    ClassicStakeRewardBN,
    StakingRewardTokenID,
} from 'types/staking';
import {WalletActionTrigger} from 'wallet';

import './styles.scss';

function getRewards(
    row: StakeRow,
    rewardToken: StakingRewardTokenID.zZKP | StakingRewardTokenID.PRP,
): BigNumber {
    if (row.stakeType === CLASSIC_TYPE_HEX && isClassic(row.reward))
        return row.reward as ClassicStakeRewardBN;

    return (row.reward as AdvancedStakeRewardsBN)[rewardToken];
}
const StakeItem = (props: {
    row: StakeRow;
    chainId: number | undefined;
    unstakeById: (id: any, trigger: WalletActionTrigger) => Promise<void>;
}) => {
    const {row, chainId, unstakeById} = props;

    const {isSmall, isMobile, isMedium} = useScreenSize();
    const [wholePart, fractionalPart] = row.amount
        ? getFormattedFractions(utils.formatEther(row.amount))
        : [];
    return (
        <React.Fragment key={row.stakedAt}>
            {row.claimedAt === 0 && (
                <Box className="stake-item-holder">
                    <Box className="balance-wrapper">
                        <Box className="balance">
                            <ExactValueTooltip balance={row.amount}>
                                <Typography component={'span'}>
                                    <StyledBalance
                                        wholePart={wholePart}
                                        fractionalPart={fractionalPart}
                                        styles="splitted-balance"
                                    />
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
                            className={classnames('info', {
                                unstakable: !!row.unstakable,
                            })}
                        >
                            <span className="title">Stake Date:</span>
                            <Typography className="value" component={'span'}>
                                {isMedium && !isMobile
                                    ? dayjs(row.stakedAt * 1000).format(
                                          'M/D/YYYY',
                                      )
                                    : dayjs(row.stakedAt * 1000).format(
                                          'MMM D, YYYY',
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
                                        ? dayjs(row.lockedTill * 1000).format(
                                              'M/d/YYYY',
                                          )
                                        : dayjs(row.lockedTill * 1000).format(
                                              'MM/DD/YYYY h:mm A',
                                          )}
                                </Typography>
                            </Box>
                        )}
                        <Box
                            className={classnames('info', {
                                unstakable: !!row.unstakable,
                            })}
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
                            className={classnames('info', {
                                unstakable: !!row.unstakable,
                            })}
                        >
                            <span
                                className={classnames('title', {
                                    unstakable: !!row.unstakable,
                                })}
                            >
                                Expected:
                                <Tooltip
                                    title={
                                        <span
                                            className="tooltip-style"
                                            dangerouslySetInnerHTML={{
                                                __html: expectedPrpBalanceTooltip,
                                            }}
                                        />
                                    }
                                    data-html="true"
                                    placement="top"
                                    className={classnames('tooltip-icon', {
                                        unstakable: !!row.unstakable,
                                    })}
                                >
                                    <IconButton>
                                        <img src={infoIcon} />
                                    </IconButton>
                                </Tooltip>
                            </span>

                            <Typography
                                component={'span'}
                                className={classnames('value', {
                                    unstakable: !!row.unstakable,
                                })}
                            >
                                {utils.formatUnits(
                                    row.stakeType === CLASSIC_TYPE_HEX
                                        ? constants.Zero
                                        : getRewards(
                                              row,
                                              StakingRewardTokenID.PRP,
                                          ),
                                    0,
                                )}

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

export default StakeItem;
