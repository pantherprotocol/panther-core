import * as React from 'react';

import {TableCell, TableRow} from '@mui/material';

import pantherIcon from '../../../../images/panther-logo.svg';
import {ZAsset} from '../../../../services/assets';
import {MoreItems} from '../../../MoreItems';
import Balance from '../../Balance';
import Network from '../../Network';

import './styles.scss';

export default function PrivateZAsset(props: {item: ZAsset; key: number}) {
    return (
        <React.Fragment>
            <TableRow className="private-zasset-row" key={props.key}>
                <TableCell align="left" className="icon-cell">
                    <img src={pantherIcon} />{' '}
                </TableCell>
                <TableCell align="right">
                    <Balance
                        balance={props.item?.balanceValue}
                        name={props.item?.name}
                        balanceValue={props.item?.balanceValue}
                    />
                </TableCell>
                <TableCell align="left">
                    <Network networkName={props.item?.name} />
                </TableCell>
                <TableCell align="left">
                    {props.item?.value} {props.item?.name}
                </TableCell>
                <TableCell align="center" className="more-items-cell">
                    <MoreItems />
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}
