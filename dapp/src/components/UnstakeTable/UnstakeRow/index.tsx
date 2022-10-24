import React from 'react';

import {TableCell, TableRow, Typography} from '@mui/material';
import {BigNumber} from 'ethers';

import {formatCurrency, formatTime} from '../../../lib/format';
import {WalletActionTrigger} from '../../../redux/slices/web3WalletLastAction';
import {isClassic} from '../../../services/rewards';
import {CLASSIC_TYPE_HEX, StakeRow} from '../../../services/staking';
import {
    AdvancedStakeRewardsBN,
    ClassicStakeRewardBN,
    StakingRewardTokenID,
} from '../../../types/staking';
import ExactValueTooltip from '../../Common/ExactValueTooltip';
import UnstakeButton from '../UnstakeButton';

import './styles.scss';

function getRewards(row: StakeRow): BigNumber {
    return row.stakeType === CLASSIC_TYPE_HEX && isClassic(row.reward)
        ? (row.reward as ClassicStakeRewardBN)
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
                        <ExactValueTooltip balance={getRewards(row)}>
                            <Typography>
                                {formatCurrency(getRewards(row))}
                            </Typography>
                        </ExactValueTooltip>

                        <Typography>
                            {row.stakeType === CLASSIC_TYPE_HEX
                                ? 'ZKP'
                                : 'zZKP'}
                        </Typography>
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
