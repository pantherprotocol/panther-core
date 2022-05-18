import * as React from 'react';

import {Button, TableCell, TableRow} from '@mui/material';
import {BigNumber} from 'ethers';

import rightSideArrow from '../../../../images/right-arrow-icon.svg';
import tetherIcon from '../../../../images/tether-icon.svg';
import {Asset} from '../../../../types/assets';
import {formatCurrency} from '../../../../utils/helpers';
import Balance from '../../Balance';
import Network from '../../Network';

import './styles.scss';

export default function PublicAsset(props: {item: Asset; key: number}) {
    const balance = formatCurrency(BigNumber.from(props.item.value));
    const balanceValue =
        '$' + formatCurrency(BigNumber.from(props.item.usdValue));

    return (
        <React.Fragment>
            <TableRow className="public-asset-row" key={props.key}>
                <TableCell align="left" className="icon-cell">
                    <img src={tetherIcon} />{' '}
                </TableCell>
                <TableCell align="right">
                    <Balance
                        balance={balance}
                        name={props.item?.name}
                        balanceValue={balanceValue}
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
