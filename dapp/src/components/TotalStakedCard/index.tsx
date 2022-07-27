import * as React from 'react';

import {IconButton} from '@mui/material';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import {useWeb3React} from '@web3-react/core';

import refreshIcon from '../../images/refresh-icon.svg';
import {formatCurrency} from '../../lib/format';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {getChainBalance} from '../../redux/slices/chainBalance';
import {totalStakedSelector} from '../../redux/slices/totalStaked';

import './styles.scss';

const TotalStakedCard = () => {
    const context = useWeb3React();
    const totalStaked = useAppSelector(totalStakedSelector);
    const totalZKPStaked = totalStaked
        ? formatCurrency(totalStaked, {scale: 18, decimals: 0}) + ' ZKP'
        : '0.00 ZKP';

    const dispatch = useAppDispatch();

    const refreshChainBalance = () => {
        dispatch(getChainBalance, context);
    };
    return (
        <Card className="total-staked-card" variant="outlined">
            <Typography className="card-title">
                Total Staked
                <IconButton onClick={refreshChainBalance}>
                    <img src={refreshIcon} />
                </IconButton>
            </Typography>
            <Typography className="card-text">{totalZKPStaked}</Typography>
            <Typography className="card-text">
                Classic staking has ended
            </Typography>
        </Card>
    );
};

export default TotalStakedCard;
