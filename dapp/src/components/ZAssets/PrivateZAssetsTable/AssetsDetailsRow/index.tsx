import * as React from 'react';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import RedeemRewards from 'components/ZAssets/PrivateZAssetsTable/RedeemReward';
import {format} from 'date-fns';
import {BigNumber, utils} from 'ethers';
import {formatCurrency} from 'lib/format';

import {AssetsDetailsRowProperties} from './AssetsDetailsRow.interface';

import './styles.scss';

const AssetsDetailsRow = (props: AssetsDetailsRowProperties) => {
    const {reward, isSelected, onSelectReward} = props;
    const balance = formatCurrency(BigNumber.from(reward.zZKP));
    const prp = formatCurrency(utils.parseEther(reward.PRP));

    return (
        <TableRow className="zAsset-staking-holder">
            <TableCell
                component="th"
                scope="row"
                className="bold-beige zAsset-staking-cell"
            >
                <span className="cell-title">Amount:</span>
                <span className="cell-content">{balance} zZKP</span>
            </TableCell>
            <TableCell className="staking-date zAsset-staking-cell">
                <span className="cell-title">Deposit Date:</span>
                <span className="cell-content">
                    {format(
                        new Date(Number(reward.creationTime) * 1000),
                        'MMM dd yyyy',
                    )}
                </span>
            </TableCell>
            <TableCell className="bold-beige zAsset-staking-cell">
                <span className="cell-title">Rewards Earned:</span>
                <span className="cell-content">{prp} PRP</span>
            </TableCell>
            <TableCell className="zassets-staking-redeem-button-holder zAsset-staking-cell">
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
