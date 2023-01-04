// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {Tooltip} from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {useWeb3React} from '@web3-react/core';
import {
    unrealizedRewardAprTooltip,
    zAssetTooltip,
} from 'components/common/tooltips';
import infoIcon from 'images/info-icon.svg';
import {chainHasPoolContract} from 'services/contracts';

import PrivateZAsset from './PrivateZAssetRow';

import './styles.scss';

export default function PrivateZAssetsTable() {
    const context = useWeb3React();
    const {active, chainId} = context;

    return (
        <TableContainer
            className="private-zAsset-table_container"
            component={Paper}
            data-testid="ZAssets_private-zassets-table_container"
        >
            <Table
                aria-label="collapsible table"
                className="private-zAsset-table_table"
            >
                <TableHead className="private-zAsset-table_head">
                    <TableRow className="private-zAsset-table_header-row">
                        <TableCell
                            align="left"
                            className="private-zAsset-table_header-cell"
                        >
                            <span className="title">Private zAssets:</span>
                            <Tooltip
                                title={
                                    <span
                                        className="tooltip-style"
                                        dangerouslySetInnerHTML={{
                                            __html: zAssetTooltip,
                                        }}
                                    />
                                }
                                data-html="true"
                                placement="top"
                                className="tooltip-icon"
                                data-testid="ZAssets_private-zassets-table_zasset-tooltip"
                            >
                                <img src={infoIcon} />
                            </Tooltip>
                        </TableCell>
                        <TableCell
                            align="left"
                            className={`private-zAsset-table_header-cell ${
                                active &&
                                chainId &&
                                !chainHasPoolContract(chainId) &&
                                'wrong-network'
                            }`}
                        >
                            <span>Unrealized Reward APR:</span>
                            <Tooltip
                                title={unrealizedRewardAprTooltip}
                                data-html="true"
                                placement="top"
                                className="tooltip-icon"
                            >
                                <img src={infoIcon} />
                            </Tooltip>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody className="private-zAsset-table_body">
                    <PrivateZAsset />
                </TableBody>
            </Table>
        </TableContainer>
    );
}
