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
import Typography from '@mui/material/Typography';
import {useWeb3React} from '@web3-react/core';
import {BigNumber} from 'ethers';

import infoIcon from '../../images/info-icon.svg';
import * as stakingService from '../../services/staking';
import {formatTime, formatCurrency} from '../../utils/helpers';
import {SafeLink} from '../Common/links';

import './styles.scss';

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
        );
    });
}

export default function UnstakeTable(props: {fetchData: () => Promise<void>}) {
    const context = useWeb3React();
    const {library, chainId, account} = context;
    const [stakedData, setStakedData] = useState<any[]>([]);

    const setTotalStaked = useCallback(async () => {
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

        const stakeData = buildStakedDataRows(
            stakes,
            rewardsBalance,
            totalStaked,
        );
        setStakedData(stakeData);
    }, [library, chainId, account]);

    const unstake = useCallback(
        async id => {
            if (!library || !chainId || !account || chainId === 137) {
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
            setTotalStaked();
            props.fetchData();
        },
        [library, chainId, account, setTotalStaked, props],
    );

    useEffect(() => {
        if (!library || !account) {
            return;
        }

        setTotalStaked();
    }, [account, library, setTotalStaked]);

    const transition = chainId === 137;
    const transitionTooltipTitle = (
        <>
            <Typography paragraph={true}>
                Due to the Polygon staking bug fix, there will be a transition
                period after{' '}
                <SafeLink href="https://docs.pantherprotocol.io/dao/governance/proposal-4-polygon-fix#proposed-actions">
                    DAO proposal 4
                </SafeLink>{' '}
                voting closes during which the fix will be applied. During this
                time unstaking will be temporarily unavailable.
            </Typography>
            <Typography paragraph={true}>
                <strong>
                    No rewards will be lost. Rewards will continue to accrue.
                </strong>
            </Typography>
            <Typography paragraph={true}>
                The transition period end is hard to predict due to the
                decentralised nature of proposal execution, but it is{' '}
                <em>likely</em> (but not guaranteed) to be less than 24 hours
                from when the vote closes at Mar 16, 2022, 2:12 PM UTC.{' '}
            </Typography>
        </>
    );

    const TransitionTooltip = (props: any) => (
        <Tooltip
            title={transitionTooltipTitle}
            data-html="true"
            placement="top"
            className="transitionTooltip"
        >
            {props.children}
        </Tooltip>
    );

    const unstakeRow = (row: StakeRow) => {
        const unstakeButton = (
            <Button
                className={`btn ${
                    row.unstakable || transition ? 'disable' : ''
                }`}
                disabled={row.unstakable || transition}
                onClick={() => {
                    if (!transition) unstake(row.id);
                }}
                endIcon={transition && <img src={infoIcon} />}
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
                        {chainId !== 137 && (
                            <TableCell align="right">
                                {row.calculatedReward} ZKP
                            </TableCell>
                        )}
                        <TableCell align="center" className="lockedTill">
                            {formatTime(row.lockedTill)} <br />
                            {transition && (
                                <TransitionTooltip>
                                    <span>
                                        <SafeLink href="https://docs.pantherprotocol.io/dao/governance/proposal-4-polygon-fix#proposed-actions">
                                            plus transition period
                                        </SafeLink>
                                    </span>
                                </TransitionTooltip>
                            )}
                        </TableCell>
                        <TableCell align="center" className="unstake">
                            {transition ? (
                                <TransitionTooltip>
                                    <div>{unstakeButton}</div>
                                </TransitionTooltip>
                            ) : (
                                unstakeButton
                            )}
                        </TableCell>
                    </TableRow>
                )}
            </React.Fragment>
        );
    };

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
                        {chainId !== 137 && (
                            <TableCell align="right">
                                Rewards
                                <Tooltip
                                    title={
                                        'Your total rewards are accrued based on your share of the staking pool. They are indicated here as being distributed proportionally between all of your stakes; however as you stake and unstake, the proportions available for redemption via each stake will change, but the total rewards will not.'
                                    }
                                    data-html="true"
                                    placement="top"
                                    className="icon"
                                >
                                    <img src={infoIcon} />
                                </Tooltip>
                            </TableCell>
                        )}
                        <TableCell align="center">Locked Till</TableCell>
                        <TableCell align="center">Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>{stakedData.map(unstakeRow)}</TableBody>
            </Table>
        </TableContainer>
    );
}
