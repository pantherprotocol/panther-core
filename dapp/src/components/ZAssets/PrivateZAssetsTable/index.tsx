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
import {assetsSelector} from '../../../redux/slices/assets';
import {ZAsset} from '../../../types/assets';

import PrivateZAsset from './PrivateZAsset';

import './styles.scss';

export default function PrivateZAssetsTable() {
    const assets = useAppSelector(assetsSelector);

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
                                title={'Private zAssets:'}
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
                                title={'Privacy Rewards'}
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
                    {assets &&
                        assets.map((item: ZAsset, key: number) => (
                            <PrivateZAsset key={key} item={item} />
                        ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
