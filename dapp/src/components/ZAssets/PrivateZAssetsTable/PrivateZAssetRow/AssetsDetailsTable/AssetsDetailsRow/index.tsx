import * as React from 'react';

import {Button} from '@mui/material';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {BigNumber} from 'ethers';

import rightSideArrow from '../../../../../../images/right-arrow-icon.svg';
import {formatCurrency} from '../../../../../../lib/format';
import {AdvancedStakeRewards} from '../../../../../../types/staking';

import './styles.scss';

const AssetsDetailsRow = (props: {reward: AdvancedStakeRewards}) => {
    const balance = formatCurrency(BigNumber.from(props.reward.zZKP));
    const prp = formatCurrency(BigNumber.from(props.reward.PRP));

    return (
        <TableRow key={1}>
            <TableCell component="th" scope="row" className="staking-date">
                1/19/2022
            </TableCell>
            <TableCell>
                <span className="zAsset-staking-type">Advanced Staking</span>
            </TableCell>
            <TableCell align="right" className="bold-beige">
                {balance} zZKP
            </TableCell>
            <TableCell align="right" className="bold-beige">
                {prp} PRP
            </TableCell>
            <TableCell align="right" className="bold-beige">
                60%
            </TableCell>
            <TableCell align="center">
                <Button
                    variant="contained"
                    className="redeem-button"
                    endIcon={<img src={rightSideArrow} />}
                >
                    <span>Redeem zZKP</span>
                </Button>
            </TableCell>
        </TableRow>
    );
};

export default AssetsDetailsRow;
