import * as React from 'react';
import {useCallback, useState} from 'react';

import {Box, Button, Tooltip, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {BigNumber, utils} from 'ethers';

import infoIcon from '../../../images/info-icon.svg';
import refreshIcon from '../../../images/refresh-icon.svg';
import {formatCurrency, formatUSD} from '../../../lib/format';
import {fiatPrice} from '../../../lib/tokenPrice';
import {useAppDispatch, useAppSelector} from '../../../redux/hooks';
import {
    refreshUTXOsStatuses,
    totalSelector,
} from '../../../redux/slices/advancedStakesRewards';
import {marketPriceSelector} from '../../../redux/slices/zkpMarketPrice';
import {StakingRewardTokenID} from '../../../types/staking';

import './styles.scss';

export default function PrivateBalance() {
    const context = useWeb3React();
    const {account} = context;
    const zkpPrice = useAppSelector(marketPriceSelector);
    const unclaimedZZKP = useAppSelector(
        totalSelector(account, StakingRewardTokenID.zZKP),
    );
    const totalPrice = zkpPrice
        ? fiatPrice(unclaimedZZKP, BigNumber.from(zkpPrice))
        : 0;

    const unclaimedPRP = useAppSelector(
        totalSelector(account, StakingRewardTokenID.PRP),
    );
    const [loading, setLoading] = useState<boolean>(false);

    const dispatch = useAppDispatch();

    // TODO: this check needs to be removed when new button will be added below
    // eslint-disable-next-line
    const refresh = useCallback(async () => {
        dispatch(refreshUTXOsStatuses, context);
    }, [context, dispatch]);

    return (
        <Box className="private-zAssets-balance-container">
            <Box className="private-zAssets-balance">
                <Typography className="title">
                    Private zAsset Balance
                </Typography>
                <Typography className="amount">
                    {totalPrice ? formatUSD(totalPrice, {decimals: 2}) : '-'}
                </Typography>
                <Typography className="zkp-rewards">
                    {unclaimedPRP
                        ? formatCurrency(
                              utils.parseEther(unclaimedPRP.toString()),
                          )
                        : '-'}{' '}
                    Total Privacy Reward Points (PRP)
                </Typography>
            </Box>

            <Box className="private-zAssets-refresh">
                <Button
                    variant="text"
                    className={`refresh-button`}
                    startIcon={!loading && <img src={refreshIcon} />}
                    onClick={async () => {
                        //Just for UI testing purposes
                        setTimeout(() => {
                            setLoading(false);
                        }, 3000);
                        setLoading(true);
                    }}
                >
                    {loading && (
                        <i
                            className="fa fa-refresh fa-spin"
                            style={{marginRight: '5px'}}
                        />
                    )}
                    {loading && <span>Loading Data from Server</span>}
                    {!loading && <span>Refresh Private Balance</span>}
                </Button>
                <Typography className="last-sync">
                    <span>Last sync 4 days ago</span>
                    <Tooltip
                        title={'Last sync ...'}
                        data-html="true"
                        placement="top"
                    >
                        <img src={infoIcon} />
                    </Tooltip>
                </Typography>
            </Box>
        </Box>
    );
}
