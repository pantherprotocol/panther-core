import * as React from 'react';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {BigNumber, utils} from 'ethers';

import {
    formatCurrency,
    formatPercentage,
    formatTime,
} from '../../../../lib/format';
import {getAdvStakingAPY} from '../../../../services/rewards';
import {AdvancedStakeRewards} from '../../../../types/staking';
import RedeemRewards from '../RedeemRewards';

import './styles.scss';

const AssetsDetailsRow = (props: {rewards: AdvancedStakeRewards}) => {
    const balance = formatCurrency(BigNumber.from(props.rewards.zZKP));
    const prp = formatCurrency(utils.parseEther(props.rewards.PRP));
    const advancedStakingAPY = getAdvStakingAPY(
        Number(props.rewards.creationTime) * 1000,
    );

    return (
        <TableRow key={props.rewards.id}>
            <TableCell component="th" scope="row" className="staking-date">
                {formatTime(Number(props.rewards.creationTime) * 1000, {
                    style: 'short',
                })}
            </TableCell>
            <TableCell>
                <span className="zAsset-staking-type">Advanced Staking</span>
            </TableCell>
            <TableCell align="right" className="bold-beige">
                {balance} zZKP
            </TableCell>
            <TableCell align="right" className="bold-beige">
                {prp} PRP
            </TableCell>
            <TableCell align="right" className="bold-beige">
                {formatPercentage(advancedStakingAPY / 100)}
            </TableCell>

            <TableCell align="center">
                <RedeemRewards rewards={props.rewards} />
            </TableCell>
        </TableRow>
    );
};

export default AssetsDetailsRow;
