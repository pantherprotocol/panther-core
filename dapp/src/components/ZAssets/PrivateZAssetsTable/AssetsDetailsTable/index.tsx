// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';
import {useEffect, useState} from 'react';

import {ZASSETS_ROWS_PER_PAGE} from 'constants/pagination';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import {useWeb3React} from '@web3-react/core';
import {classnames} from 'components/common/classnames';
import Pagination from 'components/common/Pagination';
import {unrealizedRewardAprTooltip} from 'components/common/tooltips';
import AssetsDetailsRow from 'components/ZAssets/PrivateZAssetsTable/AssetsDetailsRow';
import usePagination from 'hooks/pagination';
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
        if (
            gotExitTime ||
            !chainId ||
            !library ||
            !chainHasPoolContract(chainId)
        )
            return;
        dispatch(getPoolV0ExitTime, context);
        registerExitTimeCall(true);
    }, [context, chainId, library, dispatch, gotExitTime]);

    const {
        paginatedData,
        onLastClick,
        currentPage,
        setCurrentPage,
        totalPages,
        onNextClick,
        onPrevClick,
        maxPageLimit,
        minPageLimit,
    } = usePagination({
        data: rewardsFilteredAndSorted,
        itemsPerPage: ZASSETS_ROWS_PER_PAGE,
    });

    return (
        <Box className="assets-details-table_container">
            <Table
                size="small"
                aria-label="purchases"
                className="assets-details-table_table"
            >
                <TableHead
                    className={classnames('assets-details-table_header', {
                        'wrong-network':
                            active &&
                            !!chainId &&
                            !chainHasPoolContract(chainId),
                    })}
                >
                    <TableRow className="assets-details-table_header-row">
                        <TableCell
                            align="right"
                            className="assets-details-table_header-cell"
                        >
                            Amount:
                        </TableCell>
                        <TableCell
                            className={classnames(
                                'assets-details-table_header-cell',
                                {
                                    'fixed-deposit-date-padding':
                                        !rewardsFilteredAndSorted.length,
                                },
                            )}
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
                    {paginatedData()?.map((reward: AdvancedStakeRewards) => (
                        <AssetsDetailsRow
                            reward={reward}
                            key={reward.id}
                            isSelected={reward.id === selectedRewardId}
                            onSelectReward={setSelectedRewardId}
                        />
                    ))}
                </TableBody>
            </Table>
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
                        setCurrentPage={setCurrentPage}
                        classes="zassets-pagination"
                    />
                )}
        </Box>
    );
};
export default AssetsDetailsTable;
