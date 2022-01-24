import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {Button} from '@mui/material';
import './styles.scss';
import {useWeb3React} from '@web3-react/core';
import {useState} from 'react';
import * as stakingService from '../../services/staking';
import {useEffect} from 'react';
import {BigNumber} from 'ethers';
import {formatAccountBalance} from '../../services/account';
import {formatDate} from '../../utils';

const localStorage = window.localStorage;

export default function UnstakeTable() {
    const context = useWeb3React();
    const {account, library} = context;
    const [stakedData, setStakedData] = useState<any[]>([]);

    const createStakedDataRow = (
        id: number,
        stakedAt: number,
        amount: BigNumber,
        lockedTill: number,
    ) => {
        const unstakable = lockedTill * 1000 < new Date().getTime();
        return {
            id,
            stakedAt: stakedAt * 1000,
            amount,
            lockedTill: lockedTill * 1000,
            unstakable,
        };
    };

    const setTotalStaked = async () => {
        const stakingContract = await stakingService.getStakingContract(
            library,
        );
        if (!stakingContract) {
            return;
        }
        const stakedData = await stakingService.getTotalStaked(
            stakingContract,
            account,
        );
        const stakeData = stakedData.map(item =>
            createStakedDataRow(
                item.id,
                item.stakedAt,
                item.amount,
                item.lockedTill,
            ),
        );
        setStakedData(stakeData);
    };

    const unstake = async () => {
        const stakingContract = await stakingService.getStakingContract(
            library,
        );
        if (!stakingContract) {
            return;
        }

        const signer = library.getSigner(account).connectUnchecked();

        const stakeId = Number(localStorage.getItem('stakeId'));
        const data = '';
        const unstakeResponse = await stakingService.unstake(
            library,
            stakingContract,
            stakeId,
            signer,
            data,
        );

        if (unstakeResponse) {
            window.location.reload();
        }
    };

    useEffect(() => {
        if (!library || !account) {
            return;
        }

        setTotalStaked();
    });

    return (
        <TableContainer component={Paper}>
            <Table
                sx={{minWidth: 400}}
                size="small"
                aria-label="unstaking table"
            >
                <TableHead>
                    <TableRow>
                        <TableCell align="left">Staked Date</TableCell>
                        <TableCell align="center">Amount Staked</TableCell>
                        <TableCell align="center">Locked Until</TableCell>
                        <TableCell align="center">Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {stakedData.map(row => (
                        <TableRow
                            key={row.stakedAt}
                            sx={{
                                '&:last-child td, &:last-child th': {
                                    border: 0,
                                },
                            }}
                        >
                            <TableCell align="center">
                                {formatDate(row.stakedAt)}
                            </TableCell>
                            <TableCell align="center">
                                {formatAccountBalance(row.amount, 'ZKP')}
                            </TableCell>
                            <TableCell align="center">
                                {formatDate(row.lockedTill)}
                            </TableCell>
                            <TableCell align="center">
                                <Button
                                    className={`btn ${
                                        row.unstakable ? '' : 'disable'
                                    }`}
                                    disabled={!row.unstakable}
                                    onClick={() => {
                                        unstake();
                                    }}
                                >
                                    Unstake
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
