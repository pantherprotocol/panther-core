import {useCallback} from 'react';
import * as React from 'react';

import {Box, Button} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {BigNumber, utils} from 'ethers';

import {formatCurrency} from '../../../lib/format';
import {useAppDispatch} from '../../../redux/hooks';
import {getAdvancedStakesRewardsAndUpdateStatus} from '../../../redux/slices/advancedStakesRewards';
import {getChainBalance} from '../../../redux/slices/chainBalance';
import {getTotalsOfAdvancedStakes} from '../../../redux/slices/totalsOfAdvancedStakes';
import {getTotalUnclaimedClassicRewards} from '../../../redux/slices/totalUnclaimedClassicRewards';
import {
    startWalletAction,
    StartWalletActionPayload,
    registerWalletActionFailure,
    progressToNewWalletAction,
    registerWalletActionSuccess,
    WalletActionTrigger,
} from '../../../redux/slices/web3WalletLastAction';
import {getZkpStakedBalance} from '../../../redux/slices/zkpStakedBalance';
import {getZkpTokenBalance} from '../../../redux/slices/zkpTokenBalance';
import {notifyError} from '../../../services/errors';
import {deriveRootKeypairs} from '../../../services/keychain';
import {advancedStake} from '../../../services/staking';

import './styles.scss';

const getButtonText = (
    amount: string | null,
    amountBN: BigNumber | null,
    minStake: number | null,
    tokenBalance: BigNumber | null,
): [string, boolean] => {
    if (minStake === null) {
        return ["Couldn't get minimum stake", false];
    }
    if (!tokenBalance) {
        return ["Couldn't get token balance", false];
    }
    if (!amount || !amountBN) {
        return ['Enter amount of ZKP to stake above', false];
    }
    if (amountBN.gt(tokenBalance)) {
        console.debug(
            'Insufficient ZKP balance:',
            utils.formatEther(amountBN),
            '>',
            utils.formatEther(tokenBalance),
        );
        return ['Insufficient ZKP balance', false];
    }

    if (amountBN.gte(utils.parseEther(minStake.toString()))) {
        console.debug(
            'Sufficient ZKP balance:',
            utils.formatEther(amountBN),
            amountBN.eq(tokenBalance) ? '==' : '<=',
            utils.formatEther(tokenBalance),
        );
        // We display amount rather than stringifying amountBN, because we want
        // to make sure we display the same amount which is visible in the
        // staking amount field, and this is not guaranteed to be the same
        // due to rounding discrepancies, e.g. if Max button is clicked.
        return [
            `STAKE ${amountBN ? formatCurrency(amountBN) : '0.00'} ZKP`,
            true,
        ];
    }
    console.debug('Below minimum stake amount:', utils.formatEther(amountBN));
    return ['Stake amount must be at least 100 ZKP', false];
};

const StakingBtn = (props: {
    amountToStake: string | null;
    amountToStakeBN: BigNumber | null;
    minStake: number | null;
    tokenBalance: BigNumber | null;
    setStakingAmount: (amount: string) => void;
}) => {
    const context = useWeb3React();
    const {account, library, chainId} = context;
    const dispatch = useAppDispatch();

    const {
        amountToStake,
        amountToStakeBN,
        minStake,
        tokenBalance,
        setStakingAmount,
    } = props;

    const [buttonText, ready] = getButtonText(
        amountToStake,
        amountToStakeBN,
        minStake,
        tokenBalance,
    );
    const activeClass = ready ? 'active' : '';

    const stake = useCallback(
        async (amount: BigNumber, trigger: WalletActionTrigger) => {
            if (!chainId || !account || !tokenBalance) {
                return;
            }
            dispatch(startWalletAction, {
                name: 'signMessage',
                cause: {caller: 'StakeTab', trigger},
                data: {account},
            } as StartWalletActionPayload);
            const signer = library.getSigner(account);
            const keys = await deriveRootKeypairs(signer);
            if (keys instanceof Error) {
                dispatch(registerWalletActionFailure, 'signMessage');
                notifyError('Failed to create stake', keys.message, keys);
                return;
            }

            dispatch(progressToNewWalletAction, {
                oldAction: 'signMessage',
                newAction: {
                    name: 'stake',
                    cause: {caller: 'StakeTab', trigger},
                    data: {account},
                },
            });
            const stakingResponse = await advancedStake(
                library,
                chainId,
                keys,
                account,
                amount,
            );

            if (stakingResponse instanceof Error) {
                dispatch(registerWalletActionFailure, 'stake');
                notifyError(
                    'Failed to create stake',
                    stakingResponse.message,
                    stakingResponse,
                );
                return;
            }
            dispatch(registerWalletActionSuccess, 'stake');
            setStakingAmount('');
            dispatch(progressToNewWalletAction, {
                oldAction: 'stake',
                newAction: {
                    name: 'getAdvancedStakesRewardsAndUpdateStatus',
                    cause: {caller: 'StakeTab', trigger},
                    data: {account, caller: 'components/StakeTab'},
                },
            });

            dispatch(getAdvancedStakesRewardsAndUpdateStatus, {
                context,
                keys,
            });

            dispatch(
                registerWalletActionSuccess,
                'getAdvancedStakesRewardsAndUpdateStatus',
            );
            dispatch(getTotalsOfAdvancedStakes, context);
            dispatch(getZkpStakedBalance, context);
            dispatch(getZkpTokenBalance, context);
            dispatch(getTotalUnclaimedClassicRewards, context);
            dispatch(getChainBalance, context);
        },
        [
            library,
            account,
            chainId,
            setStakingAmount,
            context,
            dispatch,
            tokenBalance,
        ],
    );

    return (
        <Box className={`buttons-holder ${activeClass}`}>
            <Button
                className="staking-button"
                onClick={() => {
                    if (ready && amountToStakeBN) {
                        stake(amountToStakeBN, 'stake');
                    }
                }}
            >
                {buttonText}
            </Button>
        </Box>
    );
};

export default StakingBtn;
