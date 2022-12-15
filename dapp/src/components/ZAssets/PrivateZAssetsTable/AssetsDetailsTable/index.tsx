// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';
import {useEffect, useState} from 'react';

import {MAX_PAGE_LIMIT, ZASSETS_ROWS_PER_PAGE} from 'constants/pagination';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import {useWeb3React} from '@web3-react/core';
import Pagination from 'components/Common/Pagination';
import {unrealizedRewardAprTooltip} from 'components/Common/tooltips';
import AssetsDetailsRow from 'components/ZAssets/PrivateZAssetsTable/AssetsDetailsRow';
import infoIcon from 'images/info-icon.svg';
import {useAppSelector, useAppDispatch} from 'redux/hooks';
import {advancedStakesRewardsSelector} from 'redux/slices/wallet/advanced-stakes-rewards';
import {getPoolV0ExitTime} from 'redux/slices/wallet/poolV0';
import {chainHasPoolContract} from 'services/contracts';
import {AdvancedStakeRewards, UTXOStatus} from 'types/staking';

import './styles.scss';

const AssetsDetailsTable = () => {
    const context = useWeb3React();
    const {active, account, chainId, library} = context;

    const [currentPage, setCurrentPage] = useState(1);
    const [maxPageLimit, setMaxPageLimit] = useState(MAX_PAGE_LIMIT);
    const [minPageLimit, setMinPageLimit] = useState(0);

    const advancedStakesRewards = useAppSelector(
        advancedStakesRewardsSelector(chainId, account),
    );
    const rewardsFilteredAndSorted = Object.values(advancedStakesRewards)
        .filter((rewards: AdvancedStakeRewards) =>
            [UTXOStatus.UNDEFINED, UTXOStatus.UNSPENT].includes(
                rewards.zZkpUTXOStatus,
            ),
        )
        .sort(
            (a: AdvancedStakeRewards, b: AdvancedStakeRewards) =>
                Number(b.creationTime) - Number(a.creationTime),
        );

    const dispatch = useAppDispatch();
    const [gotExitTime, registerExitTimeCall] = useState<boolean>(false);
    const [selectedRewardId, setSelectedRewardId] = useState<
        string | undefined
    >(undefined);

    useEffect(() => {
        if (gotExitTime || !chainId || !library) return;
        dispatch(getPoolV0ExitTime, context);
        registerExitTimeCall(true);
    }, [context, chainId, library, dispatch, gotExitTime]);

    const indexOfLastAsset = currentPage * ZASSETS_ROWS_PER_PAGE;
    const indexOfFirstAsset = indexOfLastAsset - ZASSETS_ROWS_PER_PAGE;
    const paginatedAssets = rewardsFilteredAndSorted.slice(
        indexOfFirstAsset,
        indexOfLastAsset,
    );

    const totalPages = Math.ceil(
        rewardsFilteredAndSorted.length / ZASSETS_ROWS_PER_PAGE,
    );

    const onPageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const onPrevClick = () => {
        if (currentPage - 1 <= minPageLimit) {
            setMaxPageLimit(maxPageLimit - 1);
            setMinPageLimit(minPageLimit - 1);
        }
        setCurrentPage(prev => prev - 1);
    };

    const onNextClick = () => {
        if (currentPage + 1 > maxPageLimit) {
            setMaxPageLimit(maxPageLimit + 1);
            setMinPageLimit(minPageLimit + 1);
        }
        setCurrentPage(prev => prev + 1);
    };

    const onLastClick = (total: number) => {
        onPageChange(total);
        setMaxPageLimit(total);
        setMinPageLimit(total - MAX_PAGE_LIMIT);
    };

    return (
        <Box className="assets-details-table_container">
            <Table
                size="small"
                aria-label="purchases"
                className="assets-details-table_table"
            >
                <TableHead
                    className={`assets-details-table_header ${
                        active &&
                        chainId &&
                        !chainHasPoolContract(chainId) &&
                        'wrong-network'
                    }`}
                >
                    <TableRow className="assets-details-table_header-row">
                        <TableCell
                            align="right"
                            className="assets-details-table_header-cell"
                        >
                            Amount:
                        </TableCell>
                        <TableCell
                            className={`assets-details-table_header-cell ${
                                !rewardsFilteredAndSorted.length &&
                                'fixed-deposit-date-padding'
                            }`}
                        >
                            Deposit Date:
                        </TableCell>
                        <TableCell
                            align="right"
                            className="assets-details-table_header-cell"
                        >
                            <span className="title">Unrealized Rewards:</span>
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
                <TableBody className="assets-details-table_body">
                    {paginatedAssets.map((reward: AdvancedStakeRewards) => (
                        <AssetsDetailsRow
                            reward={reward}
                            key={reward.id}
                            isSelected={reward.id === selectedRewardId}
                            onSelectReward={setSelectedRewardId}
                        />
                    ))}
                </TableBody>
                {rewardsFilteredAndSorted.length !== 0 &&
                    rewardsFilteredAndSorted.length > ZASSETS_ROWS_PER_PAGE && (
                        <Pagination
                            totalPages={totalPages}
                            currentPage={currentPage}
                            maxPageLimit={maxPageLimit}
                            minPageLimit={minPageLimit}
                            onPrevClick={onPrevClick}
                            onNextClick={onNextClick}
                            onLastClick={onLastClick}
                            onPageChange={onPageChange}
                            styles="zassets-pagination"
                        />
                    )}
            </Table>
        </Box>
    );
};
export default AssetsDetailsTable;
