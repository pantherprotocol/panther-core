import * as React from 'react';
import {useEffect, useState} from 'react';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {useWeb3React} from '@web3-react/core';
import AssetsDetailsRow from 'components/ZAssets/PrivateZAssetsTable/AssetsDetailsRow';
import {useAppSelector, useAppDispatch} from 'redux/hooks';
import {advancedStakesRewardsSelector} from 'redux/slices/wallet/advanced-stakes-rewards';
import {getPoolV0ExitTime} from 'redux/slices/wallet/poolV0';
import {AdvancedStakeRewards, UTXOStatus} from 'types/staking';

import './styles.scss';

const AssetsDetailsTable = () => {
    const context = useWeb3React();
    const {account, chainId, library} = context;
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

    return (
        <Box sx={{margin: 1}}>
            <Table size="small" aria-label="purchases">
                <TableHead>
                    <TableRow className="staked-zAsset-row">
                        <TableCell>Date:</TableCell>
                        <TableCell align="right">Amount:</TableCell>
                        <TableCell align="right">Rewards Earned:</TableCell>
                        <TableCell align="right"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rewardsFilteredAndSorted.map(
                        (reward: AdvancedStakeRewards) => (
                            <AssetsDetailsRow
                                reward={reward}
                                key={reward.id}
                                isSelected={reward.id === selectedRewardId}
                                onSelectReward={setSelectedRewardId}
                            />
                        ),
                    )}
                </TableBody>
            </Table>
        </Box>
    );
};
export default AssetsDetailsTable;
