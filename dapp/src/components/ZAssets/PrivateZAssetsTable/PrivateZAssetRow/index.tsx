// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';
import {useState} from 'react';

import KeyboardArrowDIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import {useWeb3React} from '@web3-react/core';
import {zAssetsPageAprTooltip} from 'components/Common/constants';
import Balance from 'components/ZAssets/Balance';
import AssetsDetails from 'components/ZAssets/PrivateZAssetsTable/AssetsDetailsTable';
import infoIcon from 'images/info-icon.svg';
import pantherIcon from 'images/zAssets-panther-logo.svg';
import {formatCurrency} from 'lib/format';
import {calcUSDPrice} from 'lib/token-price';
import {useAppSelector} from 'redux/hooks';
import {zkpMarketPriceSelector} from 'redux/slices/marketPrices/zkp-market-price';
import {totalSelector} from 'redux/slices/wallet/advanced-stakes-rewards';
import {chainHasPoolContract} from 'services/contracts';
import {StakingRewardTokenID} from 'types/staking';

import './styles.scss';

export default function PrivateZAssetRow() {
    const {account, chainId, active} = useWeb3React();
    const zkpPrice = useAppSelector(zkpMarketPriceSelector);
    const unclaimedZZKP = useAppSelector(
        totalSelector(chainId, account, StakingRewardTokenID.zZKP),
    );
    const balanceValue = calcUSDPrice(unclaimedZZKP, zkpPrice);

    const [open, setOpen] = useState(true);
    return (
        <React.Fragment>
            <TableRow className="private-zAsset-row">
                <TableCell
                    align="left"
                    className="logo-cell private-zAsset-row_cell"
                >
                    {active && chainId && !chainHasPoolContract(chainId) ? (
                        <span>No zAssets Found</span>
                    ) : (
                        <>
                            {active && (
                                <IconButton
                                    className="expand-icon"
                                    aria-label="expand row"
                                    size="small"
                                    onClick={() => setOpen(!open)}
                                >
                                    {open ? (
                                        <KeyboardArrowDIcon />
                                    ) : (
                                        <KeyboardArrowRightIcon />
                                    )}
                                </IconButton>
                            )}
                            <img src={pantherIcon} />
                            <Balance
                                balance={
                                    unclaimedZZKP
                                        ? formatCurrency(unclaimedZZKP)
                                        : '-'
                                }
                                name={StakingRewardTokenID.zZKP}
                                balanceValue={balanceValue}
                            />
                        </>
                    )}
                </TableCell>
                <TableCell
                    align="left"
                    className={`apr private-zAsset-row_cell ${
                        active &&
                        chainId &&
                        !chainHasPoolContract(chainId) &&
                        'wrong-network'
                    }`}
                >
                    {active && chainId && !chainHasPoolContract(chainId) ? (
                        '-'
                    ) : (
                        <>
                            <span className="content">
                                {active ? 'X%' : '0'}
                            </span>
                            <Tooltip
                                title={zAssetsPageAprTooltip}
                                data-html="true"
                                placement="top"
                                className="tooltip-icon"
                            >
                                <IconButton>
                                    <img src={infoIcon} />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </TableCell>
            </TableRow>
            <TableRow className="private-zAsset-row">
                <TableCell
                    style={{paddingBottom: 0, paddingTop: 0}}
                    colSpan={12}
                >
                    {active && (
                        <Collapse
                            in={open}
                            timeout="auto"
                            unmountOnExit
                            color="primary"
                        >
                            <AssetsDetails />
                        </Collapse>
                    )}
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}
