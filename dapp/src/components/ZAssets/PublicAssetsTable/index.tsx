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
import {Asset} from '../../../types/assets';

import PublicAsset from './PublicAsset';

import './styles.scss';

export default function PublicAssetsTable(props: {assets: Asset[]}) {
    return (
        <TableContainer className="public-asset-container" component={Paper}>
            <Table aria-label="unstaking table">
                <TableHead>
                    <TableRow>
                        <TableCell
                            align="left"
                            colSpan={2}
                            className="column-title"
                        >
                            Public Assets:
                            <Tooltip
                                title={'public assets:'}
                                data-html="true"
                                placement="top"
                                className="icon"
                            >
                                <img src={infoIcon} />
                            </Tooltip>
                        </TableCell>
                        <TableCell align="left">Network:</TableCell>
                        <TableCell align="left" colSpan={2}></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {props.assets &&
                        props.assets.map((item, key) => (
                            <PublicAsset key={key} item={item} />
                        ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
