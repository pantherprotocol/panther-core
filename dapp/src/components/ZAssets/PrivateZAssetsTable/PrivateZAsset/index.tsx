import * as React from 'react';

import {TableCell, TableRow} from '@mui/material';
import {BigNumber} from 'ethers';

import pantherIcon from '../../../../images/panther-logo.svg';
import {ZAsset} from '../../../../types/assets';
import {formatCurrency, formatUSD} from '../../../../utils/helpers';
import Balance from '../../Balance';
import Network from '../../Network';

import './styles.scss';

export default function PrivateZAsset(props: {item: ZAsset; key: number}) {
    const balance = formatCurrency(BigNumber.from(props.item.value));
    const balanceValue = formatUSD(BigNumber.from(props.item.usdValue), {
        decimals: 2,
    });
    const prp = formatCurrency(BigNumber.from(props.item.prpAmount));

    return (
        <React.Fragment>
            <TableRow className="private-zasset-row">
                <TableCell align="left" className="icon-cell">
                    <img src={pantherIcon} />{' '}
                </TableCell>
                <TableCell align="right">
                    <Balance
                        balance={balance}
                        name={props.item.name}
                        balanceValue={balanceValue}
                    />
                </TableCell>
                <TableCell align="left">
                    <Network networkName={props.item.network} />
                </TableCell>
                <TableCell align="left">{prp} PRP</TableCell>
                {/* <TableCell align="center" className="more-items-cell"> */}
                {/* <MoreItems /> */}
                {/* </TableCell> */}
            </TableRow>
        </React.Fragment>
    );
}
