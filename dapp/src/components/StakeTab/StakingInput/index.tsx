// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';
import {useCallback, useEffect} from 'react';

import {Box, Input, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {classnames} from 'components/common/classnames';
import {utils} from 'ethers';
import logo from 'images/panther-logo.svg';
import {formatCurrency} from 'lib/format';
import {roundDown, safeParseUnits} from 'lib/numbers';
import {useAppDispatch, useAppSelector} from 'redux/hooks';
import {
    calculateRewards,
    resetRewards,
} from 'redux/slices/staking/advanced-stake-predicted-rewards';
import {
    resetStakeAmount,
    setStakeAmount,
} from 'redux/slices/staking/stake-amount';
import {
    termsPropertySelector,
    isStakingOpenSelector,
} from 'redux/slices/staking/stake-terms';
import {zkpTokenBalanceSelector} from 'redux/slices/wallet/zkp-token-balance';
import {StakeType} from 'types/staking';

import {StakingInputProps} from './StakingInput.interface';

import './styles.scss';

export default function StakingInput(props: StakingInputProps) {
    const dispatch = useAppDispatch();
    const context = useWeb3React();
    const {account, chainId} = context;

    const tokenBalance = useAppSelector(zkpTokenBalanceSelector);
    const isStakingOpen = useAppSelector(
        isStakingOpenSelector(chainId, StakeType.Advanced),
    );
    const minLockPeriod = useAppSelector(
        termsPropertySelector(chainId!, StakeType.Advanced, 'minLockPeriod'),
    );
    const allowedSince = useAppSelector(
        termsPropertySelector(chainId!, StakeType.Advanced, 'allowedSince'),
    );
    const allowedTill = useAppSelector(
        termsPropertySelector(chainId!, StakeType.Advanced, 'allowedTill'),
    );
    const disabled = !account || !isStakingOpen;

    const clearStakedValue = useCallback(() => {
        dispatch(resetStakeAmount);
        dispatch(resetRewards);
    }, [dispatch]);

    const onChange = useCallback(
        (amount: string) => {
            if (tokenBalance && Number(tokenBalance)) {
                const bn = safeParseUnits(amount);
                if (bn) {
                    dispatch(setStakeAmount, amount as string);
                    dispatch(calculateRewards, [
                        bn.toString(),
                        minLockPeriod,
                        allowedSince,
                        allowedTill,
                    ]);
                    return;
                }
            }
            clearStakedValue();
        },
        [
            tokenBalance,
            clearStakedValue,
            dispatch,
            minLockPeriod,
            allowedSince,
            allowedTill,
        ],
    );

    useEffect(() => {
        clearStakedValue();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account]);

    const inputHandler = useCallback(
        (e: any) => {
            const value = e.target.value;

            const regex = /^\d{0,12}(\.\d{0,3})?$/;
            if (!regex.test(value)) {
                return;
            }
            onChange(value.toString());
        },
        [onChange],
    );

    return (
        <Box className="staking-input-holder">
            <Box className="staking-input-header">
                <Box className="amount-to-stake">
                    <Typography className="amount-to-stake-caption">
                        Amount to stake:
                    </Typography>
                </Box>
                <Box className="available-to-stake">
                    <Typography
                        className="available-to-stake-caption"
                        variant="subtitle2"
                        component="span"
                    >
                        Available to stake:
                    </Typography>
                    <Typography
                        className="available-to-stake-token-balance"
                        variant="subtitle2"
                        component="span"
                    >
                        {tokenBalance
                            ? formatCurrency(tokenBalance) + ' ZKP'
                            : '-'}
                    </Typography>
                </Box>
            </Box>
            <Box className="staking-input-container">
                <Box className="staking-input-box">
                    <Input
                        data-testid="input-item"
                        inputProps={{
                            pattern: '[0-9.]*',
                            inputMode: 'decimal',
                            maxLength: 16,
                        }}
                        className="staking-input"
                        value={props.amountToStake}
                        onChange={inputHandler}
                        autoComplete="off"
                        autoFocus={true}
                        placeholder="0"
                        disableUnderline={true}
                        disabled={disabled}
                        aria-describedby="staking-value-helper-text"
                    />
                    <Typography
                        variant="caption"
                        component="span"
                        className={classnames('staking-input-token-name', {
                            'invisible-token-name': !!props.amountToStake,
                        })}
                    >
                        ZKP
                    </Typography>
                </Box>
                <Typography
                    variant="caption"
                    component="span"
                    className="staking-input-max"
                    onClick={() => {
                        if (tokenBalance) {
                            onChange(
                                roundDown(utils.formatEther(tokenBalance), 3),
                            );
                        }
                    }}
                >
                    MAX
                </Typography>
                <Box className="staking-input-box-inner">
                    <img src={logo} />
                </Box>
            </Box>
        </Box>
    );
}
