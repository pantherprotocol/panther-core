import * as React from 'react';
import {useCallback, useEffect} from 'react';

import {Box, Button, Tooltip, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {BigNumber} from 'ethers';

import infoIcon from '../../../images/info-icon.svg';
import refreshIcon from '../../../images/refresh-icon.svg';
import {parseTxErrorMessage} from '../../../lib/errors';
import {formatCurrency, formatTimeSince, formatUSD} from '../../../lib/format';
import {fiatPrice} from '../../../lib/tokenPrice';
import {useAppDispatch, useAppSelector} from '../../../redux/hooks';
import {
    lastRefreshTime,
    statusSelector,
    hasUndefinedUTXOsSelector,
    totalSelector,
    refreshUTXOsStatuses,
} from '../../../redux/slices/advancedStakesRewards';
import {
    registerWalletActionFailure,
    registerWalletActionSuccess,
    showWalletActionInProgressSelector,
    startWalletAction,
    StartWalletActionPayload,
    walletActionStatusSelector,
} from '../../../redux/slices/web3WalletLastAction';
import {marketPriceSelector} from '../../../redux/slices/zkpMarketPrice';
import {notifyError} from '../../../services/errors';
import {deriveRootKeypairs} from '../../../services/keychain';
import {
    StakingRewardTokenID,
    WalletSignatureTrigger,
} from '../../../types/staking';
import SignatureRequestModal from '../../SignatureRequestModal';

import './styles.scss';

export default function PrivateBalance() {
    const context = useWeb3React();
    const {account, chainId, library} = context;
    const dispatch = useAppDispatch();

    const zkpPrice = useAppSelector(marketPriceSelector);
    const unclaimedZZKP = useAppSelector(
        totalSelector(chainId, account, StakingRewardTokenID.zZKP),
    );
    const totalPrice = zkpPrice
        ? fiatPrice(unclaimedZZKP, BigNumber.from(zkpPrice))
        : 0;

    const unclaimedPRP = useAppSelector(
        totalSelector(chainId, account, StakingRewardTokenID.PRP, true),
    );

    const lastRefresh = useAppSelector(lastRefreshTime);
    const status = useAppSelector(statusSelector);
    const loading = status === 'loading';

    const hasUndefinedUTXOs = useAppSelector(
        hasUndefinedUTXOsSelector(chainId, account),
    );
    const walletActionStatus = useAppSelector(walletActionStatusSelector);

    const refreshUTXOs = useCallback(
        async (trigger: WalletSignatureTrigger) => {
            dispatch(startWalletAction, {
                name: 'signMessage',
                cause: {caller: 'PrivateBalance', trigger},
                data: {account},
            } as StartWalletActionPayload);
            const signer = library.getSigner(account);
            const keys = await deriveRootKeypairs(signer);
            if (keys instanceof Error) {
                dispatch(registerWalletActionFailure, 'signMessage');
                notifyError(
                    'Failed to refresh zAssets',
                    `Cannot sign a message: ${parseTxErrorMessage(keys)}`,
                    keys,
                );
                return;
            }
            dispatch(registerWalletActionSuccess, 'signMessage');

            dispatch(startWalletAction, {
                name: 'refreshUTXOsStatuses',
                cause: {caller: 'PrivateBalance', trigger},
                data: {account, caller: 'components/PrivateBalance'},
            } as StartWalletActionPayload);
            dispatch(refreshUTXOsStatuses, {context, keys});
            dispatch(registerWalletActionSuccess, 'refreshUTXOsStatuses');
        },
        [account, context, dispatch, library],
    );

    const refreshIfUndefinedUTXOs = async () => {
        if (walletActionStatus === 'in progress' || !hasUndefinedUTXOs) return;
        await refreshUTXOs('undefined UTXOs');
    };

    useEffect(() => {
        refreshIfUndefinedUTXOs();
        // Empty dependency array as it needs to be run only once on the load
        // eslint-disable-next-line
    }, []);

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
    const showWalletActionInProgress = useAppSelector(
        showWalletActionInProgressSelector,
    );

    return (
        <>
            {showWalletActionInProgress && <SignatureRequestModal />}
            <Box className="private-zAssets-balance-container">
                <Box className="private-zAssets-balance">
                    <Typography className="title">
                        Private zAsset Balance
                    </Typography>
                    <Typography className="amount">
                        {totalPrice
                            ? formatUSD(totalPrice, {decimals: 2})
                            : '-'}
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
                        onClick={() => refreshUTXOs('manual refresh')}
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
                        <Tooltip
                            title={toolTip}
                            data-html="true"
                            placement="top"
                        >
                            <img src={infoIcon} />
                        </Tooltip>
                    </Typography>
                </Box>
            </Box>
        </>
    );
}
