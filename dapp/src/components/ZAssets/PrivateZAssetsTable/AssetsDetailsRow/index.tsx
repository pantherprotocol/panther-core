// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {AssetsDetailsRowProperties} from 'asset';
import RedeemRewards from 'components/ZAssets/PrivateZAssetsTable/RedeemReward';
import dayjs from 'dayjs';
import {BigNumber} from 'ethers';
import {formatCurrency} from 'lib/format';
import {unrealizedPrpReward} from 'services/rewards';

import './styles.scss';

const AssetsDetailsRow = (props: AssetsDetailsRowProperties) => {
    const {asset, isSelected, onSelectReward} = props;
    const balance = formatCurrency(BigNumber.from(asset.amount));

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
                    {dayjs(Number(asset.creationTime) * 1000).format(
                        'MMM DD YYYY',
                    )}
                </span>
            </TableCell>
            <TableCell className="bold-beige zAsset-staking-cell">
                <span className="cell-title">Rewards Earned:</span>
                <span className="cell-content prp-content">
                    {unrealizedPrpReward(
                        BigNumber.from(asset.amount),
                        Number(asset.creationTime) * 1000,
                    ).toString()}{' '}
                    PRP
                </span>
            </TableCell>
            <TableCell className="zassets-staking-redeem-button-holder zAsset-staking-cell">
                <RedeemRewards
                    asset={asset}
                    key={asset.id}
                    isSelected={isSelected}
                    onSelectReward={onSelectReward}
                />
            </TableCell>
        </TableRow>
    );
};

export default AssetsDetailsRow;
