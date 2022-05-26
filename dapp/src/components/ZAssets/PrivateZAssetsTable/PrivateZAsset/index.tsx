import * as React from 'react';

import {TableCell, TableRow} from '@mui/material';
import {BigNumber} from 'ethers';

import pantherIcon from '../../../../images/panther-logo.svg';
import {useAppSelector} from '../../../../redux/hooks';
import {marketPriceSelector} from '../../../../redux/slices/zkpMarketPrice';
import {AdvancedStakeReward} from '../../../../types/staking';
import {calcUSDPrice, formatCurrency} from '../../../../utils/helpers';
import Balance from '../../Balance';
import Network from '../../Network';

import './styles.scss';

export default function PrivateZAsset(props: {
    item: AdvancedStakeReward;
    key: number;
}) {
    const zkpPrice = useAppSelector(marketPriceSelector);
    const zZKP = formatCurrency(BigNumber.from(props.item.zZKP));
    const zZKPValue = calcUSDPrice(BigNumber.from(props.item.zZKP), zkpPrice);
    const prp = formatCurrency(BigNumber.from(props.item.PRP));

    return (
        <React.Fragment>
            <TableRow className="private-zasset-row">
                <TableCell align="left" className="icon-cell">
                    <img src={pantherIcon} />{' '}
                </TableCell>
                <TableCell align="right">
                    <Balance
                        balance={zZKP}
                        name={'zZKP'}
                        balanceValue={zZKPValue}
                    />
                </TableCell>
                <TableCell align="left">
                    <Network networkName={'Polygon zAsset'} />
                </TableCell>
                <TableCell align="left">{prp} PRP</TableCell>
                {/* <TableCell align="center" className="more-items-cell"> */}
                {/* <MoreItems /> */}
                {/* </TableCell> */}
            </TableRow>
        </React.Fragment>
    );
}
