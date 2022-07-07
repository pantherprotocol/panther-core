import * as React from 'react';
import {useCallback} from 'react';

import {Box, Button, Tooltip, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {BigNumber} from 'ethers';

import infoIcon from '../../../images/info-icon.svg';
import refreshIcon from '../../../images/refresh-icon.svg';
import {formatCurrency, formatTimeSince, formatUSD} from '../../../lib/format';
import {fiatPrice} from '../../../lib/tokenPrice';
import {useAppDispatch, useAppSelector} from '../../../redux/hooks';
import {
    lastRefreshTime,
    refreshUTXOsStatuses,
    statusSelector,
    totalSelector,
} from '../../../redux/slices/advancedStakesRewards';
import {marketPriceSelector} from '../../../redux/slices/zkpMarketPrice';
import {StakingRewardTokenID} from '../../../types/staking';

import './styles.scss';

export default function PrivateBalance() {
    const context = useWeb3React();
    const {account, chainId} = context;
    const zkpPrice = useAppSelector(marketPriceSelector);
    const unclaimedZZKP = useAppSelector(
        totalSelector(chainId, account, StakingRewardTokenID.zZKP),
    );
    const totalPrice = zkpPrice
        ? fiatPrice(unclaimedZZKP, BigNumber.from(zkpPrice))
        : 0;

    const unclaimedPRP = useAppSelector(
        totalSelector(chainId, account, StakingRewardTokenID.PRP),
    );

    const lastRefresh = useAppSelector(lastRefreshTime);
    const status = useAppSelector(statusSelector);
    const loading = status === 'loading';

    const dispatch = useAppDispatch();

    const refresh = useCallback(async () => {
        dispatch(refreshUTXOsStatuses, context);
    }, [context, dispatch]);

    const toolTip = (
        <div>
            <p>Shows when the last refresh was done.</p>
            <p>
                Some of your assets may not be shown if they were not updated
                recently. You can refresh your assets by clicking the refresh
                button above.
            </p>
            <p>
                A signature request is required each time in order to generate
                the root keys to your Panther wallet. These are highly security
                sensitive, so they are not stored on disk.
            </p>
        </div>
    );

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
                        ? formatCurrency(unclaimedPRP, {scale: 0})
                        : '-'}{' '}
                    Total Privacy Reward Points (PRP)
                </Typography>
            </Box>

            <Box className="private-zAssets-refresh">
                <Button
                    variant="text"
                    className={`refresh-button`}
                    startIcon={!loading && <img src={refreshIcon} />}
                    onClick={refresh}
                >
                    {loading && (
                        <i
                            className="fa fa-refresh fa-spin"
                            style={{marginRight: '5px'}}
                        />
                    )}
                    {loading && <span>Scanning Panther wallet</span>}
                    {!loading && <span>Refresh Private Balance</span>}
                </Button>
                <Typography className="last-sync">
                    <span>
                        Last sync{' '}
                        {lastRefresh ? formatTimeSince(lastRefresh) : '-'}
                    </span>
                    <Tooltip title={toolTip} data-html="true" placement="top">
                        <img src={infoIcon} />
                    </Tooltip>
                </Typography>
            </Box>
        </Box>
    );
}
