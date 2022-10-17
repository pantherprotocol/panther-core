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
import {parseTxErrorMessage} from '@panther-core/crypto/lib/utils/errors';
import {useWeb3React} from '@web3-react/core';
import {BigNumber, constants} from 'ethers';

import {awaitConfirmationAndRetrieveEvent} from '../../lib/events';
import {formatTime} from '../../lib/format';
import {useAppDispatch} from '../../redux/hooks';
import {getChainBalance} from '../../redux/slices/chainBalance';
import {getTotalsOfAdvancedStakes} from '../../redux/slices/totalsOfAdvancedStakes';
import {getTotalUnclaimedClassicRewards} from '../../redux/slices/totalUnclaimedClassicRewards';
import {
    registerWalletActionFailure,
    registerWalletActionSuccess,
    startWalletAction,
    StartWalletActionPayload,
    WalletActionTrigger,
} from '../../redux/slices/web3WalletLastAction';
import {getZkpStakedBalance} from '../../redux/slices/zkpStakedBalance';
import {getZkpTokenBalance} from '../../redux/slices/zkpTokenBalance';
import {unstake, getStakesAndRewards} from '../../services/staking';
import {MessageWithTx} from '../Common/MessageWithTx';
import {removeNotification, openNotification} from '../Common/notification';

import UnstakeRow from './UnstakeRow';

import './styles.scss';

async function unstakeWithNotification(
    library: any,
    chainId: number,
    account: string,
    stakeID: BigNumber,
    data: string | undefined,
) {
    const [tx, err] = await unstake(
        library,
        chainId,
        account,
        stakeID,
        data,
        false,
    );

    if (err) {
        openNotification(
            'Transaction error',
            <MessageWithTx
                message={parseTxErrorMessage(err)}
                chainId={chainId}
                txHash={tx?.hash}
            />,
            'danger',
        );
        return err;
    }

    const inProgress = openNotification(
        'Transaction in progress',
        <MessageWithTx
            message="Your unstaking transaction is currently in progress. Please wait for confirmation!"
            chainId={chainId}
            txHash={tx?.hash}
        />,

        'info',
    );

    const event = await awaitConfirmationAndRetrieveEvent(tx, 'StakeClaimed');
    removeNotification(inProgress);

    if (event instanceof Error) {
        openNotification(
            'Transaction error',
            <MessageWithTx
                message={parseTxErrorMessage(event)}
                txHash={tx?.hash}
                chainId={chainId}
            />,
            'danger',
        );
        return err;
    }

    openNotification(
        'Unstaking completed successfully',
        <MessageWithTx
            message="Congratulations! Your unstaking transaction was processed!"
            txHash={tx?.hash}
            chainId={chainId}
        />,

        'info',
        10000,
    );
}

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
        async (id, trigger: WalletActionTrigger) => {
            if (!library || !chainId || !account) {
                return;
            }
            dispatch(startWalletAction, {
                name: 'signMessage',
                cause: {caller: 'UnstakeTab', trigger},
                data: {account},
            } as StartWalletActionPayload);

            const stakeID = BigNumber.from(id);
            const data = '0x00';

            const response = await unstakeWithNotification(
                library,
                chainId,
                account,
                stakeID,
                data,
            );
            if (response !== undefined) {
                dispatch(registerWalletActionFailure, 'signMessage');
                return;
            }
            dispatch(registerWalletActionSuccess, 'signMessage');

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
        <Box
            className="unstake-table"
            data-testid="unstake-table_unstake-table_container"
        >
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
