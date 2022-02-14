import {useState, useEffect} from 'react';
import * as React from 'react';

import {Button} from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {useWeb3React} from '@web3-react/core';
import {BigNumber} from 'ethers';

import {formatAccountBalance, formatTokenBalance} from '../../services/account';
import * as stakingService from '../../services/staking';
import {getRewardsBalance} from '../../services/staking';
import {formatTime} from '../../utils';

import './styles.scss';

export default function UnstakeTable() {
    const context = useWeb3React();
    const {account, library} = context;
    const [stakedData, setStakedData] = useState<any[]>([]);

    const createStakedDataRow = (
        id: number,
        stakedAt: number,
        amount: BigNumber,
        calculatedReward: string,
        lockedTill: number,
        claimedAt: number,
    ) => {
        const unstakable = lockedTill * 1000 > new Date().getTime();
        return {
            id,
            stakedAt: stakedAt * 1000,
            amount,
            calculatedReward,
            lockedTill: lockedTill * 1000,
            unstakable,
            claimedAt,
        };
    };

    const setTotalStaked = async () => {
        if (!account) {
            return;
        }
        const stakingContract = await stakingService.getStakingContract(
            library,
        );
        if (!stakingContract) {
            return;
        }
        const stakingTokenContract =
            await stakingService.getStakingTokenContract(library);
        if (!stakingTokenContract) {
            return;
        }
        const rewardsMasterContract =
            await stakingService.getRewardsMasterContract(library);
        if (!rewardsMasterContract) {
            return;
        }
        const stakes = await stakingService.getAccountStakes(
            stakingContract,
            account,
        );

        const totalStaked = stakingService.sumActiveAccountStakes(stakes);
        const rewardsBalance = await getRewardsBalance(
            rewardsMasterContract,
            account,
        );
        if (!rewardsBalance) return;

        const stakeData = stakes.map(item => {
            const calculatedReward = formatTokenBalance(
                rewardsBalance.mul(item.amount).div(totalStaked),
            );
            if (!calculatedReward) return;
            return createStakedDataRow(
                item.id,
                item.stakedAt,
                item.amount,
                calculatedReward,
                item.lockedTill,
                item.claimedAt,
            );
        });
        setStakedData(stakeData);
    };

    const unstake = async id => {
        const stakingContract = await stakingService.getStakingContract(
            library,
        );
        if (!stakingContract) {
            return;
        }

        const signer = library.getSigner(account).connectUnchecked();

        const stakeID = BigNumber.from(id);
        const data = '0x00';
        await stakingService.unstake(
            library,
            stakingContract,
            stakeID,
            signer,
            data,
            false,
        );
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
                        <TableCell align="center">Rewards</TableCell>
                        <TableCell align="center">Locked Till</TableCell>
                        <TableCell align="center">Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {stakedData.map(row => (
                        <React.Fragment key={row.stakedAt}>
                            {row.claimedAt == 0 && (
                                <TableRow
                                    sx={{
                                        '&:last-child td, &:last-child th': {
                                            border: 0,
                                        },
                                    }}
                                >
                                    <TableCell align="center">
                                        {formatTime(row.stakedAt)}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatAccountBalance(
                                            row.amount,
                                            'ZKP',
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        {row.calculatedReward} ZKP
                                    </TableCell>
                                    <TableCell align="center">
                                        {formatTime(row.lockedTill)}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button
                                            className={`btn ${
                                                !row.unstakable ? '' : 'disable'
                                            }`}
                                            disabled={row.unstakable}
                                            onClick={() => {
                                                unstake(row.id);
                                            }}
                                        >
                                            Unstake
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
