import {useCallback, useEffect, useState} from 'react';
import * as React from 'react';

import {Box} from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {useWeb3React} from '@web3-react/core';
import {BigNumber, constants} from 'ethers';

import {formatTime} from '../../lib/format';
import {useAppDispatch} from '../../redux/hooks';
import {getChainBalance} from '../../redux/slices/chainBalance';
import {getTotalsOfAdvancedStakes} from '../../redux/slices/totalsOfAdvancedStakes';
import {getTotalUnclaimedClassicRewards} from '../../redux/slices/totalUnclaimedClassicRewards';
import {getZkpStakedBalance} from '../../redux/slices/zkpStakedBalance';
import {getZkpTokenBalance} from '../../redux/slices/zkpTokenBalance';
import {unstake, getStakesAndRewards} from '../../services/staking';

import UnstakeRow from './UnstakeRow';

import './styles.scss';

export default function UnstakeTable() {
    const context = useWeb3React();
    const {library, chainId, account} = context;
    const dispatch = useAppDispatch();
    const [stakedData, setStakedData] = useState<any[]>([]);

    const fetchStakedData = useCallback(async () => {
        if (!library || !chainId || !account) {
            return;
        }
        const [totalStaked, stakeRows] = await getStakesAndRewards(
            library,
            chainId,
            account,
        );
        if (!stakeRows) {
            setStakedData([]);
            return;
        }

        if (totalStaked.gt(constants.Zero)) {
            const block = await library.getBlock();
            console.debug(
                'Current block',
                block.number,
                'is at',
                block.timestamp,
                formatTime(block.timestamp * 1000),
            );

            stakeRows.forEach(row => {
                row.unstakable = block.timestamp > row.lockedTill;
            });

            setStakedData(stakeRows);
        } else {
            setStakedData([]);
        }
    }, [library, chainId, account]);

    const unstakeById = useCallback(
        async id => {
            if (!library || !chainId || !account) {
                return;
            }

            const stakeID = BigNumber.from(id);
            const data = '0x00';
            await unstake(library, chainId, account, stakeID, data, false);
            dispatch(getTotalsOfAdvancedStakes, context);
            dispatch(getZkpStakedBalance, context);
            dispatch(getTotalUnclaimedClassicRewards, context);
            dispatch(getZkpTokenBalance, context);
            dispatch(getChainBalance, context);

            fetchStakedData();
        },
        [library, chainId, account, context, dispatch, fetchStakedData],
    );

    useEffect(() => {
        if (!library || !account) {
            return;
        }

        fetchStakedData();
    }, [account, library, fetchStakedData]);

    return (
        <Box className="unstake-table">
            <TableContainer component={Paper}>
                <Table
                    size="small"
                    sx={{minWidth: 400}}
                    aria-label="unstaking table"
                >
                    <TableHead className="table-head">
                        <TableRow>
                            <TableCell align="left">Description:</TableCell>
                            <TableCell align="left">Amount:</TableCell>
                            <TableCell align="left">Rewards:</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stakedData.map(row => (
                            <UnstakeRow
                                key={row.stakedAt}
                                row={row}
                                unstakeById={unstakeById}
                                chainId={chainId}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
