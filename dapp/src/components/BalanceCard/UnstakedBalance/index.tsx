import * as React from 'react';

import {Box, IconButton, Tooltip, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {BigNumber, utils} from 'ethers';

import {parseTxErrorMessage} from '../../../../src/services/errors';
import infoIcon from '../../../images/info-icon.svg';
import refreshIcon from '../../../images/refresh-icon.svg';
import {formatUSD, getFormattedFractions} from '../../../lib/format';
import {useAppDispatch, useAppSelector} from '../../../redux/hooks';
import {getAdvancedStakesRewardsAndUpdateStatus} from '../../../redux/slices/advancedStakesRewards';
import {
    progressToNewWalletAction,
    registerWalletActionFailure,
    registerWalletActionSuccess,
    startWalletAction,
    StartWalletActionPayload,
    WalletSignatureTrigger,
} from '../../../redux/slices/web3WalletLastAction';
import {
    getZkpTokenBalance,
    zkpTokenBalanceSelector,
    zkpUnstakedUSDMarketPriceSelector,
} from '../../../redux/slices/zkpTokenBalance';
import {generateRootKeypairs} from '../../../services/keys';
import {notifyError} from '../../Common/errors';
import ExactValueTooltip from '../../Common/ExactValueTooltip';

import './styles.scss';

export default function UnstakedBalance() {
    const [loading, setLoading] = React.useState<boolean>(false);
    const context = useWeb3React();
    const dispatch = useAppDispatch();
    const tokenBalance = useAppSelector(zkpTokenBalanceSelector);
    const tokenMarketPrice = useAppSelector(zkpUnstakedUSDMarketPriceSelector);

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

            setLoading(true);

            await dispatch(getAdvancedStakesRewardsAndUpdateStatus, {
                context,
                keys,
                withRetry: false,
            });

            setLoading(false);

            dispatch(
                registerWalletActionSuccess,
                'getAdvancedStakesRewardsAndUpdateStatus',
            );
        },
        [context, dispatch],
    );

    const [whole, fractional] = tokenBalance
        ? getFormattedFractions(utils.formatEther(tokenBalance))
        : [];

    return (
        <Box className="total-balance">
            <Box className="title-box">
                <Typography className="title">Available ZKP Balance</Typography>
                {false && (
                    <Tooltip
                        title="This is the amount of ZKP you have available for staking."
                        placement="top"
                    >
                        <IconButton>
                            <img src={infoIcon} />
                        </IconButton>
                    </Tooltip>
                )}
                <IconButton
                    className="refresh-button"
                    onClick={() =>
                        RefreshTokenBalanceAndRewards('manual refresh')
                    }
                >
                    {loading ? (
                        <i className="fa fa-refresh fa-spin spin-icon" />
                    ) : (
                        <img src={refreshIcon} />
                    )}
                </IconButton>
            </Box>

            <Box className="amount-box">
                <ExactValueTooltip balance={tokenBalance}>
                    <Typography component="div" className="token-balance">
                        {whole && fractional ? (
                            <>
                                <span>${whole}</span>

                                <span className="substring">.{fractional}</span>
                            </>
                        ) : (
                            <>
                                <span>0</span>

                                <span className="substring">.00</span>
                            </>
                        )}
                    </Typography>
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
