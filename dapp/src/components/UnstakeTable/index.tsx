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
import {BigNumber, constants} from 'ethers';

import infoIcon from '../../images/info-icon.svg';
import {useAppDispatch} from '../../redux/hooks';
import {getTotalStaked} from '../../redux/slices/totalStaked';
import {resetUnclaimedRewards} from '../../redux/slices/unclaimedRewards';
import {getZkpStakedBalance} from '../../redux/slices/zkpStakedBalance';
import {getZkpTokenBalance} from '../../redux/slices/zkpTokenBalance';
import {chainHasStakesReporter} from '../../services/contracts';
import {unstake, StakeRow, getStakesAndRewards} from '../../services/staking';
import {formatTime, formatCurrency} from '../../utils/helpers';

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
                row.unstakable = row.lockedTill > block.timestamp;
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
            dispatch(getTotalStaked(context));
            dispatch(getZkpStakedBalance(context));
            dispatch(resetUnclaimedRewards());
            dispatch(getZkpTokenBalance(context));
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

    const unstakeRow = (row: StakeRow) => {
        const unstakeButton = (
            <Button
                className={`btn ${row.unstakable ? 'disable' : ''}`}
                disabled={row.unstakable}
                onClick={() => {
                    unstakeById(row.id);
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
                            {formatTime(row.stakedAt * 1000)}
                        </TableCell>
                        <TableCell align="right">
                            {formatCurrency(row.amount, {
                                decimals: 2,
                            })}{' '}
                            ZKP
                        </TableCell>
                        <TableCell align="right">
                            {formatCurrency(BigNumber.from(row.reward))} ZKP
                        </TableCell>
                        <TableCell align="center" className="lockedTill">
                            {formatTime(row.lockedTill * 1000)} <br />
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
