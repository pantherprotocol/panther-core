import * as React from 'react';

import {Button, TableCell, TableRow} from '@mui/material';

import rightSideArrow from '../../../../images/right-arrow-icon.svg';
import tetherIcon from '../../../../images/tether-icon.svg';
import {ZAsset} from '../../../../services/assets';
import Balance from '../../Balance';
import Network from '../../Network';

import './styles.scss';

export default function PublicAsset(props: {item: ZAsset; key: number}) {
    return (
        <React.Fragment>
            <TableRow className="public-asset-row" key={props.key}>
                <TableCell align="left" className="icon-cell">
                    <img src={tetherIcon} />{' '}
                </TableCell>
                <TableCell align="right">
                    <Balance
                        balance={props.item?.balanceValue}
                        name={props.item?.name}
                        balanceValue={props.item?.balanceValue}
                    />
                </TableCell>
                <TableCell align="left">
                    <Network networkName={'Polygon'} />
                </TableCell>
                <TableCell align="right">
                    <Button
                        variant="contained"
                        className="mint-button"
                        endIcon={<img src={rightSideArrow} />}
                    >
                        <span>Mint Private zAsset</span>
                    </Button>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}
