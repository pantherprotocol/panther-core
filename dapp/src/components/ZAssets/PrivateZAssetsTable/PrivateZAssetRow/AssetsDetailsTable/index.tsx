import * as React from 'react';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import {useAppSelector} from '../../../../../redux/hooks';
import {advancedStakesRewardsSelector} from '../../../../../redux/slices/advancedStakesRewards';
import {AdvancedStakeRewards} from '../../../../../types/staking';

import AssetsDetailsRow from './AssetsDetailsRow';

import './styles.scss';

const AssetsDetailsTable = () => {
    const advancedStakesRewards = useAppSelector(advancedStakesRewardsSelector);

    return (
        <Box sx={{margin: 1}}>
            <Table size="small" aria-label="purchases">
                <TableHead>
                    <TableRow className="staked-zAsset-row">
                        <TableCell>Date:</TableCell>
                        <TableCell>Type:</TableCell>
                        <TableCell align="right">Amount:</TableCell>
                        <TableCell align="right">Rewards Earned:</TableCell>
                        <TableCell align="right">APY:</TableCell>
                        <TableCell align="right"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {advancedStakesRewards.map(
                        (asset: AdvancedStakeRewards, key: number) => (
                            <AssetsDetailsRow reward={asset} key={key} />
                        ),
                    )}
                </TableBody>
            </Table>
        </Box>
    );
};
export default AssetsDetailsTable;
