import React from 'react';

import {Typography} from '@mui/material';
import {BigNumber, utils} from 'ethers';
import {getFormattedFractions} from 'lib/format';

import './styles.scss';

type BalanceProps = {
    balance?: BigNumber | null;
};
const StyledBalance = (props: BalanceProps) => {
    const [whole, fractional] = props.balance
        ? getFormattedFractions(utils.formatEther(props.balance))
        : [];
    return (
        <div className="styled-balance">
            <Typography component="div" className="balance">
                <span>{whole ?? 0}</span>
                <span className="substring">.{fractional ?? 0.0}</span>
            </Typography>
        </div>
    );
};
export default StyledBalance;
