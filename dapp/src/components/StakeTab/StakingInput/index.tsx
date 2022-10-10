import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';

import {Box, Input, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {utils} from 'ethers';

import logo from '../../../images/panther-logo.svg';
import {formatCurrency} from '../../../lib/format';
import {safeParseUnits} from '../../../lib/numbers';
import {useAppDispatch, useAppSelector} from '../../../redux/hooks';
import {
    calculateRewards,
    resetRewards,
} from '../../../redux/slices/advancedStakePredictedRewards';
import {
    resetStakeAmount,
    setStakeAmount,
} from '../../../redux/slices/stakeAmount';
import {
    termsSelector,
    isStakingOpenSelector,
} from '../../../redux/slices/stakeTerms';
import {zkpTokenBalanceSelector} from '../../../redux/slices/zkpTokenBalance';
import {StakeType} from '../../../types/staking';

import {StakingInputProps} from './StakingInput.interface';

import './styles.scss';

export default function StakingInput(props: StakingInputProps) {
    const dispatch = useAppDispatch();
    const context = useWeb3React();
    const {account, chainId} = context;

    const [inputTextLength, setInputTextLength] = useState<number>(0);
    const tokenBalance = useAppSelector(zkpTokenBalanceSelector);
    const isStakingOpen = useAppSelector(
        isStakingOpenSelector(chainId, StakeType.Advanced),
    );
    const minLockPeriod = useAppSelector(
        termsSelector(chainId!, StakeType.Advanced, 'minLockPeriod'),
    );
    const disabled = !account || !isStakingOpen;

    const onChange = useCallback(
        (amount: string) => {
            if (tokenBalance && Number(tokenBalance)) {
                const bn = safeParseUnits(amount);
                if (bn) {
                    dispatch(setStakeAmount, amount as string);
                    dispatch(calculateRewards, [bn.toString(), minLockPeriod]);
                    return;
                }
            }
            dispatch(resetStakeAmount);
            dispatch(resetRewards);
        },
        [tokenBalance, dispatch, minLockPeriod],
    );

    const inputHandler = useCallback(
        (e: any) => {
            const value = e.target.value;
            setInputTextLength(value.length);

            const regex = /^\d{0,9}(\.\d{0,18})?$/;
            if (!regex.test(value)) {
                return;
            }
            onChange(value.toString());
        },
        [onChange],
    );

    useEffect(() => {
        setInputTextLength(props.amountToStake?.length ?? 0);
    }, [props.amountToStake]);

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
                            maxLength: 28,
                        }}
                        className={`staking-input ${
                            Math.floor(inputTextLength / 15) ? 'long-input' : ''
                        }`}
                        value={props.amountToStake}
                        onChange={inputHandler}
                        autoComplete="off"
                        autoFocus={true}
                        placeholder="0.0"
                        disableUnderline={true}
                        disabled={disabled}
                        aria-describedby="staking-value-helper-text"
                    />
                    <Typography
                        variant="caption"
                        component="span"
                        className={`staking-input-token-name ${
                            props.amountToStake && ' invisible-token-name'
                        }`}
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
                            onChange(utils.formatEther(tokenBalance));
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
