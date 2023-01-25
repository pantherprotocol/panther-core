import React from 'react';

import {classnames} from '../classnames';

import './styles.scss';

type BalanceProps = {
    wholePart?: string;
    fractionalPart?: string;
    styles?: string;
};
const StyledBalance = (props: BalanceProps) => {
    const {wholePart = '0', fractionalPart = '00', styles = ''} = props;

    return (
        <div className={classnames('styled-balance', styles)}>
            <span className="whole">{wholePart}</span>
            <span className="substring">.{fractionalPart}</span>
        </div>
    );
};
export default StyledBalance;
