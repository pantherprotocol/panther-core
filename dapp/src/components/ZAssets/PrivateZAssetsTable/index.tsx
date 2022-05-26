import * as React from 'react';

import {Tooltip} from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import infoIcon from '../../../images/info-icon.svg';

import PrivateZAsset from './PrivateZAsset';

import './styles.scss';

export default function PrivateZAssetsTable() {
    const zAssetTooltip = `$zZKP in a MASP. This reward is calculated based on your
        Stake but created as a transaction in the MASP. You will be able to redeem $zZKP
        for $ZKP using the Withdraw option at the end of the Advanced Staking period.`;

    const prpTooltip = `PRPs (Panther Reward Points). This additional reward, aimed
        toward incentivizing Advanced Staking, will also be created in the Shielded Pool as
        a calculation based on the number of $zZKP for a given user. Users will be able to
        convert PRPs to $ZKP using the Reward Converter when the core protocol (Panther Core
        V1) launches.`;

    return (
        <TableContainer className="private-zAsset-container" component={Paper}>
            <Table aria-label="collapsible table">
                <TableHead>
                    <TableRow>
                        <TableCell align="left" colSpan={3}>
                            Private zAssets:
                            <Tooltip
                                title={zAssetTooltip}
                                data-html="true"
                                placement="top"
                                className="tooltip-icon"
                            >
                                <img src={infoIcon} />
                            </Tooltip>
                        </TableCell>
                        <TableCell align="left" colSpan={1}>
                            Network:
                        </TableCell>
                        <TableCell align="left" colSpan={2}>
                            Privacy Rewards:
                            <Tooltip
                                title={prpTooltip}
                                data-html="true"
                                placement="top"
                                className="tooltip-icon"
                            >
                                <img src={infoIcon} />
                            </Tooltip>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <PrivateZAsset />
                </TableBody>
            </Table>
        </TableContainer>
    );
}
