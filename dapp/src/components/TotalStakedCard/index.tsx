import * as React from 'react';

import {IconButton} from '@mui/material';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import {useWeb3React} from '@web3-react/core';

import refreshIcon from '../../images/refresh-icon.svg';
import {useAppDispatch} from '../../redux/hooks';
import {getChainBalance} from '../../redux/slices/chainBalance';

import './styles.scss';

const TotalStakedCard = () => {
    const context = useWeb3React();
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
            <Typography className="card-text">
                350k / 500k zZKP Rewards
            </Typography>
            <Typography className="card-text">
                Classic staking has ended
            </Typography>
        </Card>
    );
};

export default TotalStakedCard;
