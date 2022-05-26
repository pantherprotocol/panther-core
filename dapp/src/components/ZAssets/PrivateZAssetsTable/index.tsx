import * as React from 'react';

import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
} from '@mui/material';

import infoIcon from '../../../images/info-icon.svg';
import {useAppSelector} from '../../../redux/hooks';
import {advancedStakesRewardsSelector} from '../../../redux/slices/advancedStakesRewards';
import {AdvancedStakeReward} from '../../../types/staking';

import PrivateZAsset from './PrivateZAsset';

import './styles.scss';

export default function PrivateZAssetsTable() {
    const advancedStakeRewards = useAppSelector(advancedStakesRewardsSelector);

    const zAssetTooltip = `$zZKP in a MASP. This reward is calculated based on your
    Stake but created as a transaction in the MASP. You will be able to redeem $zZKP
    for $ZKP using the Withdraw option at the end of the Advanced Staking period.`;

    const prpTooltip = `PRPs (Panther Reward Points). This additional reward, aimed
    toward incentivizing Advanced Staking, will also be created in the Shielded Pool as
    a calculation based on the number of $zZKP for a given user. Users will be able to
    convert PRPs to $ZKP using the Reward Converter when the core protocol (Panther Core
    V1) launches.`;

    return (
        <TableContainer className="private-zasset-container" component={Paper}>
            <Table aria-label="unstaking table">
                <TableHead>
                    <TableRow className="header-row">
                        <TableCell
                            align="left"
                            colSpan={2}
                            className="column-title"
                        >
                            Private zAssets
                            <Tooltip
                                title={zAssetTooltip}
                                data-html="true"
                                placement="top"
                                className="icon"
                            >
                                <img src={infoIcon} />
                            </Tooltip>
                        </TableCell>
                        <TableCell align="left">Network</TableCell>
                        <TableCell align="left" colSpan={2}>
                            Privacy Rewards
                            <Tooltip
                                title={prpTooltip}
                                data-html="true"
                                placement="top"
                                className="icon"
                            >
                                <img src={infoIcon} />
                            </Tooltip>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {advancedStakeRewards.map(
                        (item: AdvancedStakeReward, key: number) => (
                            <PrivateZAsset key={key} item={item} />
                        ),
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
