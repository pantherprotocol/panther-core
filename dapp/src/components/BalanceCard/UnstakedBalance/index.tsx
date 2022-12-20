// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {
    Box,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {notifyError} from 'components/Common/errors';
import ExactValueTooltip from 'components/Common/ExactValueTooltip';
import StyledBalance from 'components/Common/StyledBalance';
import {balanceUpdatingTooltip} from 'components/Common/tooltips';
import {BigNumber} from 'ethers';
import refreshIcon from 'images/refresh-icon.svg';
import {formatUSD} from 'lib/format';
import {useAppDispatch, useAppSelector} from 'redux/hooks';
import {isWalletUpdatingSelector} from 'redux/slices/ui/is-wallet-updating';
import {
    progressToNewWalletAction,
    registerWalletActionFailure,
    registerWalletActionSuccess,
    startWalletAction,
    StartWalletActionPayload,
    WalletSignatureTrigger,
} from 'redux/slices/ui/web3-wallet-last-action';
import {getAdvancedStakesRewardsAndUpdateStatus} from 'redux/slices/wallet/advanced-stakes-rewards';
import {
    getZkpTokenBalance,
    zkpTokenBalanceSelector,
    zkpUnstakedUSDMarketPriceSelector,
} from 'redux/slices/wallet/zkp-token-balance';
import {parseTxErrorMessage} from 'services/errors';
import {generateRootKeypairs} from 'services/keys';

import './styles.scss';

export default function UnstakedBalance() {
    const context = useWeb3React();
    const dispatch = useAppDispatch();
    const tokenBalance = useAppSelector(zkpTokenBalanceSelector);
    const tokenMarketPrice = useAppSelector(zkpUnstakedUSDMarketPriceSelector);
    const isWalletUpdating = useAppSelector(isWalletUpdatingSelector);

    const RefreshTokenBalanceAndRewards = React.useCallback(
        async (trigger: WalletSignatureTrigger) => {
            dispatch(getZkpTokenBalance, context);
            const {account, library} = context;

            dispatch(startWalletAction, {
                name: 'signMessage',
                cause: {caller: 'UnstakedBalance', trigger},
                data: {account},
            } as StartWalletActionPayload);
            const signer = library!.getSigner(account!);
            const keys = await generateRootKeypairs(signer);
            if (keys instanceof Error) {
                dispatch(registerWalletActionFailure, 'signMessage');
                notifyError({
                    message: 'Failed to refresh rewards',
                    details: `Cannot sign a message: ${parseTxErrorMessage(
                        keys,
                    )}`,
                });
            }

            dispatch(progressToNewWalletAction, {
                oldAction: 'signMessage',
                newAction: {
                    name: 'getAdvancedStakesRewardsAndUpdateStatus',
                    cause: {caller: 'UnstakedBalance', trigger},
                    data: {
                        account,
                        caller: 'components/BalanceCard/UnstakedBalance',
                    },
                },
            });

            await dispatch(getAdvancedStakesRewardsAndUpdateStatus, {
                context,
                keys,
                withRetry: false,
            });

            dispatch(
                registerWalletActionSuccess,
                'getAdvancedStakesRewardsAndUpdateStatus',
            );
        },
        [context, dispatch],
    );

    return (
        <Box className="total-balance">
            <Box className="title-box">
                <Typography className="title">Available ZKP Balance</Typography>
                <IconButton
                    className="refresh-button"
                    onClick={() =>
                        RefreshTokenBalanceAndRewards('manual refresh')
                    }
                >
                    {isWalletUpdating ? (
                        <Tooltip title={balanceUpdatingTooltip} placement="top">
                            <CircularProgress
                                color="inherit"
                                className="spin-icon"
                            />
                        </Tooltip>
                    ) : (
                        <img src={refreshIcon} />
                    )}
                </IconButton>
            </Box>

            <Box className="amount-box">
                <ExactValueTooltip balance={tokenBalance}>
                    <StyledBalance
                        balance={tokenBalance}
                        styles="splitted-balance"
                    />
                </ExactValueTooltip>

                <Typography className="zkp-symbol main-symbol">ZKP</Typography>
            </Box>
            <Box className="amount-box">
                <Typography className="token-market-price">
                    {`~${
                        tokenMarketPrice
                            ? formatUSD(tokenMarketPrice)
                            : formatUSD(BigNumber.from('0'), {decimals: 0})
                    }`}
                </Typography>
            </Box>
        </Box>
    );
}
