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
import RedeemRewards from '../RedeemReward';

import {AssetsDetailsRowProperties} from './AssetsDetailsRow.interface';

import './styles.scss';

const AssetsDetailsRow = (props: AssetsDetailsRowProperties) => {
    const {reward, isSelected, onSelectReward} = props;
    const balance = formatCurrency(BigNumber.from(reward.zZKP));
    const prp = formatCurrency(utils.parseEther(reward.PRP));
    const advancedStakingAPY = getAdvStakingAPY(
        Number(reward.creationTime) * 1000,
    );

    return (
        <TableRow key={reward.id} className="zAsset-staking-holder">
            <TableCell component="th" scope="row" className="staking-date">
                {formatTime(Number(reward.creationTime) * 1000, {
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
                <RedeemRewards
                    reward={reward}
                    key={reward.id}
                    isSelected={isSelected}
                    onSelectReward={onSelectReward}
                />
            </TableCell>
        </TableRow>
    );
};

export default AssetsDetailsRow;
