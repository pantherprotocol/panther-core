import React from 'react';

import {BigNumber, utils} from 'ethers';
import {getFormattedFractions} from 'lib/format';

import './styles.scss';

type BalanceProps = {
    balance?: BigNumber | null | number;
    styles?: string;
};
const StyledBalance = (props: BalanceProps) => {
    const {balance, styles = ''} = props;

    const [whole, fractional] = balance
        ? getFormattedFractions(utils.formatEther(balance))
        : [];
    return (
        <div className={`styled-balance ${styles}`}>
            <span className="whole">{whole ?? 0}</span>
            <span className="substring">.{fractional}</span>
        </div>
    );
};
export default StyledBalance;
