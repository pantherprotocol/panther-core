import * as React from 'react';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import RedeemRewards from 'components/ZAssets/PrivateZAssetsTable/RedeemReward';
import {BigNumber, utils} from 'ethers';
import {formatCurrency, formatTime} from 'lib/format';

import {AssetsDetailsRowProperties} from './AssetsDetailsRow.interface';

import './styles.scss';

const AssetsDetailsRow = (props: AssetsDetailsRowProperties) => {
    const {reward, isSelected, onSelectReward} = props;
    const balance = formatCurrency(BigNumber.from(reward.zZKP));
    const prp = formatCurrency(utils.parseEther(reward.PRP));

    return (
        <TableRow key={reward.id} className="zAsset-staking-holder">
            <TableCell component="th" scope="row" className="staking-date">
                {formatTime(Number(reward.creationTime) * 1000, {
                    style: 'short',
                })}
            </TableCell>
            <TableCell align="right" className="bold-beige">
                {balance} zZKP
            </TableCell>
            <TableCell align="right" className="bold-beige">
                {prp} PRP
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
