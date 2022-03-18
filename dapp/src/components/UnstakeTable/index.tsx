import {useCallback, useEffect, useState} from 'react';
import * as React from 'react';

import {Tooltip, Button} from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {useWeb3React} from '@web3-react/core';
import {BigNumber} from 'ethers';

import infoIcon from '../../images/info-icon.svg';
import {chainHasStakesReporter} from '../../services/contracts';
import * as stakingService from '../../services/staking';
import {formatTime, formatCurrency} from '../../utils/helpers';

import './styles.scss';

const createStakedDataRow = (
    id: number,
    stakedAt: number,
    amount: BigNumber,
    calculatedReward: string,
    lockedTill: number,
    claimedAt: number,
    now: number,
) => {
    const unstakable = lockedTill * 1000 > now;
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

interface StakeRow {
    id: number;
    stakedAt: number;
    amount: BigNumber;
    calculatedReward: BigNumber;
    lockedTill: number;
    unstakable: boolean;
    claimedAt: number;
}

function buildStakedDataRows(
    stakedData: any,
    rewardsBalance: BigNumber,
    totalStaked: BigNumber,
    now: number,
): StakeRow[] {
    return stakedData.map((item: StakeRow) => {
        const calculatedReward = formatCurrency(
            rewardsBalance.mul(item.amount).div(totalStaked),
            {decimals: 2},
        );
        if (!calculatedReward) return;
        return createStakedDataRow(
            item.id,
            item.stakedAt,
            item.amount,
            calculatedReward,
            item.lockedTill,
            item.claimedAt,
            now,
        );
    });
}

export default function UnstakeTable(props: {fetchData: () => Promise<void>}) {
    const context = useWeb3React();
    const {library, chainId, account} = context;
    const [stakedData, setStakedData] = useState<any[]>([]);

    const fetchStakedData = useCallback(async () => {
        if (!library || !chainId || !account) {
            return;
        }
        const stakes = await stakingService.getAccountStakes(
            library,
            chainId,
            account,
        );

        const totalStaked = stakingService.sumActiveAccountStakes(stakes);
        const rewardsBalance = await stakingService.getRewardsBalance(
            library,
            chainId,
            account,
        );
        if (!rewardsBalance) return;

        const block = await library.getBlock();
        console.debug(
            'Current block',
            block.number,
            'is at',
            block.timestamp,
            formatTime(block.timestamp * 1000),
        );
        const stakeData = buildStakedDataRows(
            stakes,
            rewardsBalance,
            totalStaked,
            block.timestamp * 1000,
        );
        setStakedData(stakeData);
    }, [library, chainId, account]);

    const unstake = useCallback(
        async id => {
            if (!library || !chainId || !account) {
                return;
            }

            const stakeID = BigNumber.from(id);
            const data = '0x00';
            await stakingService.unstake(
                library,
                chainId,
                account,
                stakeID,
                data,
                false,
            );
            fetchStakedData();
            props.fetchData();
        },
        [library, chainId, account, fetchStakedData, props],
    );

    useEffect(() => {
        if (!library || !account) {
            return;
        }

        fetchStakedData();
    }, [account, library, fetchStakedData]);

    const unstakeRow = (row: StakeRow) => {
        const unstakeButton = (
            <Button
                className={`btn ${row.unstakable ? 'disable' : ''}`}
                disabled={row.unstakable}
                onClick={() => {
                    unstake(row.id);
                }}
            >
                Unstake
            </Button>
        );

        return (
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
                            {formatCurrency(row.amount, {
                                decimals: 2,
                            })}{' '}
                            ZKP
                        </TableCell>
                        <TableCell align="right">
                            {row.calculatedReward} ZKP
                        </TableCell>
                        <TableCell align="center" className="lockedTill">
                            {formatTime(row.lockedTill)} <br />
                        </TableCell>
                        <TableCell align="center" className="unstake">
                            {unstakeButton}
                        </TableCell>
                    </TableRow>
                )}
            </React.Fragment>
        );
    };

    const rewardsTooltip = chainHasStakesReporter(chainId) ? (
        <div>
            With the new <code>StakeRewardsController</code> contract on
            Polygon, each stake is managed independently, rather than being your
            account's share of the staking pool. So rewards are accrued
            independently for each stake, rather than being distributed
            proportionally between all of your stakes. This means that unlike on
            Ethereum mainnet, if you unstake one stake, it will not change the
            rewards shown for other active stakes.
        </div>
    ) : (
        <div>
            Your total rewards are accrued based on your share of the staking
            pool. They are indicated here as being distributed proportionally
            between all of your stakes; however as you stake and unstake, the
            proportions available for redemption via each stake will change, but
            the total rewards will not.
        </div>
    );

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
                        <TableCell align="right">Amount Staked</TableCell>
                        <TableCell align="right">
                            Rewards
                            <Tooltip
                                title={rewardsTooltip}
                                data-html="true"
                                placement="top"
                                className="icon"
                            >
                                <img src={infoIcon} />
                            </Tooltip>
                        </TableCell>
                        <TableCell align="center">Locked Till</TableCell>
                        <TableCell align="center">Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>{stakedData.map(unstakeRow)}</TableBody>
            </Table>
        </TableContainer>
    );
}
