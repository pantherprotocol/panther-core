// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';

import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {notifyError} from 'components/Common/errors';
import StyledBalance from 'components/Common/StyledBalance';
import {
    privateBalanceLastSync,
    totalUnrealizedPrivacyRewardsTooltip,
} from 'components/Common/tooltips';
import SignatureRequestModal from 'components/SignatureRequestModal';
import {BigNumber, utils} from 'ethers';
import {useStatusError} from 'hooks/status-error';
import attentionIcon from 'images/attention-triangle-icon.svg';
import infoIcon from 'images/info-icon.svg';
import refreshIcon from 'images/refresh-icon.svg';
import {
    formatCurrency,
    formatTimeSince,
    getFormattedFractions,
} from 'lib/format';
import {fiatPrice} from 'lib/token-price';
import {useAppDispatch, useAppSelector} from 'redux/hooks';
import {zkpMarketPriceSelector} from 'redux/slices/marketPrices/zkp-market-price';
import {isWalletConnectedSelector} from 'redux/slices/ui/is-wallet-connected';
import {
    progressToNewWalletAction,
    registerWalletActionFailure,
    registerWalletActionSuccess,
    showWalletActionInProgressSelector,
    startWalletAction,
    StartWalletActionPayload,
    WalletSignatureTrigger,
    walletActionStatusSelector,
} from 'redux/slices/ui/web3-wallet-last-action';
import {
    lastRefreshTime,
    statusSelector,
    hasUndefinedUTXOsSelector,
    totalSelector,
    refreshUTXOsStatuses,
    totalUnrealizedPrpSelector,
    resetAdvancedStakesRewardsStatus,
} from 'redux/slices/wallet/advanced-stakes-rewards';
import {chainHasPoolContract} from 'services/contracts';
import {parseTxErrorMessage} from 'services/errors';
import {generateRootKeypairs} from 'services/keys';
import {StakingRewardTokenID} from 'types/staking';

import './styles.scss';

export default function PrivateBalance() {
    const context = useWeb3React();
    const {account, chainId, library, active} = context;
    const dispatch = useAppDispatch();

    // We need a preliminary scan of undefined UTXOs (if any) on initial page
    // load.  We need to keep track of whether this is in progress or complete
    // in order not to trigger additional scans via the useEffect being
    // triggered by any Redux dispatch during the first load.
    const [firstUTXOscan, setFirstUTXOScan] = useState<
        'needed' | 'in progress' | 'complete' | 'failed'
    >('needed');

    const zkpPrice = useAppSelector(zkpMarketPriceSelector);
    const unclaimedZZKP = useAppSelector(
        totalSelector(chainId, account, StakingRewardTokenID.zZKP),
    );
    const totalUnrealizedPrp = useAppSelector(
        totalUnrealizedPrpSelector(chainId, account),
    );
    const totalPrice = zkpPrice
        ? fiatPrice(unclaimedZZKP, BigNumber.from(zkpPrice))
        : 0;

    const lastRefresh = useAppSelector(lastRefreshTime);
    const status = useAppSelector(statusSelector);
    const loading = status === 'loading';

    const hasUndefinedUTXOs = useAppSelector(
        hasUndefinedUTXOsSelector(chainId, account),
    );
    const walletActionStatus = useAppSelector(walletActionStatusSelector);
    const isWalletConnected = useAppSelector(isWalletConnectedSelector);

    const refreshUTXOs = useCallback(
        async (trigger: WalletSignatureTrigger) => {
            setFirstUTXOScan('in progress');
            dispatch(startWalletAction, {
                name: 'signMessage',
                cause: {caller: 'PrivateBalance', trigger},
                data: {account},
            } as StartWalletActionPayload);
            const signer = library.getSigner(account);
            const keys = await generateRootKeypairs(signer);
            if (keys instanceof Error) {
                dispatch(registerWalletActionFailure, 'signMessage');
                notifyError({
                    message: 'Failed to refresh zAssets',
                    details: `Cannot sign a message: ${parseTxErrorMessage(
                        keys,
                    )}`,
                    triggerError: keys,
                });
                setFirstUTXOScan('failed');
                return;
            }
            dispatch(progressToNewWalletAction, {
                oldAction: 'signMessage',
                newAction: {
                    name: 'refreshUTXOsStatuses',
                    cause: {caller: 'PrivateBalance', trigger},
                    data: {account, caller: 'components/PrivateBalance'},
                },
            });

            dispatch(refreshUTXOsStatuses, {context, keys});
            dispatch(registerWalletActionSuccess, 'refreshUTXOsStatuses');
            setFirstUTXOScan('complete');
        },
        [account, context, dispatch, library],
    );

    useStatusError(
        'Failed to refresh UTXOs',
        'Cannot refresh UTXOs',
        statusSelector,
        resetAdvancedStakesRewardsStatus,
    );

    const refreshIfUndefinedUTXOs = useCallback(async () => {
        if (!account || !library) {
            return;
        }
        if (walletActionStatus === 'in progress') {
            console.debug(
                `Wallet action already in progress; won't refresh for undefined UTXOs`,
            );
            return;
        }
        if (firstUTXOscan != 'needed') {
            console.debug(
                `Skipping refresh for undefined UTXOs; already ${firstUTXOscan}`,
            );
            return;
        }
        if (!hasUndefinedUTXOs) {
            console.debug('no undefined UTXOs');
            return;
        }
        await refreshUTXOs('undefined UTXOs');
    }, [
        account,
        library,
        walletActionStatus,
        hasUndefinedUTXOs,
        refreshUTXOs,
        firstUTXOscan,
    ]);

    useEffect(() => {
        refreshIfUndefinedUTXOs();
    }, [refreshIfUndefinedUTXOs]);

    const toolTip = (
        <div>
            <p>Shows when you last refreshed this page.</p>
            <p>{privateBalanceLastSync}</p>
        </div>
    );
    const showWalletSignatureInProgress = useAppSelector(
        showWalletActionInProgressSelector('signMessage'),
    );
    const [wholePart, fractionalPart] = totalPrice
        ? getFormattedFractions(utils.formatEther(totalPrice))
        : [];

    return (
        <>
            {showWalletSignatureInProgress && <SignatureRequestModal />}
            <Box
                className="private-zAssets-balance-container"
                data-testid="ZAssets_private-balance_container"
            >
                <Box className="private-zAssets-balance">
                    <Typography className="title">
                        Total Private zAsset Balance
                    </Typography>
                    <StyledBalance
                        wholePart={`$${wholePart}`}
                        fractionalPart={`${fractionalPart} USD`}
                        styles="amount"
                    />
                    <Typography className="zkp-rewards">
                        {formatCurrency(totalUnrealizedPrp, {
                            scale: 0,
                            decimals: 0,
                        })}{' '}
                        <span className="info">
                            Total Unrealized Privacy Reward Points
                        </span>
                        <Tooltip
                            title={
                                <span
                                    className="tooltip-style"
                                    dangerouslySetInnerHTML={{
                                        __html: totalUnrealizedPrivacyRewardsTooltip,
                                    }}
                                />
                            }
                            data-html="true"
                            placement="top"
                            className="tooltip-icon"
                        >
                            <IconButton>
                                <img src={infoIcon} />
                            </IconButton>
                        </Tooltip>
                    </Typography>
                </Box>

                <Box className="private-zAssets-refresh">
                    <Button
                        variant="text"
                        className={`refresh-button`}
                        startIcon={
                            !loading && (
                                <img
                                    src={
                                        firstUTXOscan === 'failed'
                                            ? attentionIcon
                                            : refreshIcon
                                    }
                                />
                            )
                        }
                        onClick={() => refreshUTXOs('manual refresh')}
                        disabled={
                            !active ||
                            !isWalletConnected ||
                            (!!chainId && !chainHasPoolContract(chainId))
                        }
                    >
                        {loading && (
                            <CircularProgress
                                color="inherit"
                                className="spin-icon"
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
