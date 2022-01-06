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

/*function createData(
    id: string,
    date: string,
    amount: string,
    earned: string,
    unstakable: boolean,
) {
    return {id, date, amount, earned, unstakable};
}*/

/*const rows = [
    createData('1', '12/01/2021', '1,500 ZKP', '15.12 PRP', true),
    createData('2', '12/01/2021', '2,500 ZKP', '25.59 PRP', true),
    createData('3', '12/01/2021', '5,000 ZKP', '50.17 PRP', false),
    createData('3', '12/01/2021', '5,000 ZKP', '50.17 PRP', false),
];*/

const localStorage = window.localStorage;

export default function UnstakeTable() {
    const context = useWeb3React();
    const {account, library} = context;
    const [stakedData, setStakedData] = useState<any[]>([]);

    const setTotalStaked = async () => {
        const stakingContract = await stakingService.getStakingContract(
            library,
        );
        const stakedData = await stakingService.getTotalStaked(
            stakingContract,
            account,
        );
        setStakedData(stakedData);
    };

    const unstake = async () => {
        const stakingContract = await stakingService.getStakingContract(
            library,
        );

        const stakeId = Number(localStorage.getItem('stakeId'));
        const data = '';
        await stakingService.unstake(stakingContract, stakeId, data);
    };

    useEffect(() => {
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
                        <TableCell>Stake Date</TableCell>
                        <TableCell align="right">Amount Staked</TableCell>
                        <TableCell align="right">PRP Earned</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {stakedData.map(row => (
                        <TableRow
                            key={row.date}
                            sx={{
                                '&:last-child td, &:last-child th': {
                                    border: 0,
                                },
                            }}
                        >
                            <TableCell component="th" scope="row">
                                {row.date}
                            </TableCell>
                            <TableCell align="right">{row.amount}</TableCell>
                            <TableCell align="right">{row.earned}</TableCell>
                            <TableCell align="right">
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
