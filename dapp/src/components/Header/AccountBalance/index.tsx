import * as React from 'react';

import {InputAdornment, IconButton, Box} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import refreshIcon from '../../../images/refresh-icon.svg';
import {useAppDispatch, useAppSelector} from '../../../redux/hooks';
import {
    chainBalanceSelector,
    getChainBalance,
} from '../../../redux/slices/chainBalance';
import {formatCurrency} from '../../../utils/helpers';

import './styles.scss';

export default function AccountBalance(props: {
    networkSymbol: string | undefined;
}) {
    const context = useWeb3React();
    const chainBalance = useAppSelector(chainBalanceSelector);
    const dispatch = useAppDispatch();

    const refreshChainBalance = () => {
        dispatch(getChainBalance, context);
    };

    return (
        <Box className="account-balance">
            <IconButton onClick={refreshChainBalance}>
                <img src={refreshIcon} />
            </IconButton>
            {formatCurrency(chainBalance, {decimals: 3}) || '-'}
            <InputAdornment position="end" className="currency-symbol">
                <span>{props.networkSymbol || '-'}</span>
            </InputAdornment>
        </Box>
    );
}
