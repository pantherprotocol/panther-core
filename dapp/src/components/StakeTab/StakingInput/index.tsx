import * as React from 'react';

import {Box, Input, InputAdornment, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {BigNumber} from 'ethers';

import logo from '../../../images/panther-logo.svg';
import {formatCurrency} from '../../../utils/helpers';

import './styles.scss';

const StakingInput = (props: {
    tokenBalance: BigNumber | null;
    amountToStake: string | null;
    setStakingAmount: (amount: string) => void;
    setStakingAmountBN: (amount: BigNumber) => void;
    networkLogo?: string;
}) => {
    const context = useWeb3React();
    const {account} = context;
    const changeHandler = (e: any) => {
        const inputTextLength = e.target.value.length;
        if (inputTextLength > 12) {
            return;
        }

        const regex = /^\d*\.?\d*$/; // matches floating points numbers
        if (!regex.test(e.target.value)) {
            return false;
        }
        if (props.tokenBalance && Number(props.tokenBalance)) {
            const amount = e.target.value.toString();
            props.setStakingAmount(amount);
            return true;
        } else {
            return false;
        }
    };
    return (
        <>
            <Box className="staking-input-header">
                <Typography
                    className="amount-to-stake-caption"
                    variant="subtitle2"
                    component="span"
                >
                    Amount to stake
                </Typography>
                <span>
                    <Typography
                        className="available-to-stake-caption"
                        variant="subtitle2"
                        component="span"
                    >
                        Available to stake:
                    </Typography>
                    <Typography
                        className="token-balance"
                        variant="subtitle2"
                        component="span"
                    >
                        {formatCurrency(props.tokenBalance)}
                    </Typography>
                    <Typography
                        className="token-balance"
                        variant="subtitle2"
                        component="span"
                    >
                        ZKP
                    </Typography>
                    <Typography
                        variant="caption"
                        component="span"
                        className="staking-input-max"
                        onClick={() => {
                            if (props.tokenBalance) {
                                props.setStakingAmountBN(props.tokenBalance);
                            }
                        }}
                    >
                        MAX
                    </Typography>
                </span>
            </Box>
            <Box className="staking-input-container">
                <Box className="staking-input-box">
                    <Input
                        inputProps={{pattern: '[0-9.]*', inputMode: 'decimal'}}
                        className="staking-input"
                        value={props.amountToStake}
                        onChange={changeHandler}
                        autoComplete="off"
                        autoFocus={true}
                        placeholder="0"
                        disableUnderline={true}
                        disabled={!account}
                        endAdornment={
                            <InputAdornment
                                position="end"
                                className="staking-input-symbol"
                            >
                                <div className="staking-symbol-holder">
                                    {props.networkLogo && (
                                        <img
                                            src={props.networkLogo}
                                            alt="Network logo"
                                        />
                                    )}
                                    <span>ZKP</span>
                                </div>
                            </InputAdornment>
                        }
                        aria-describedby="staking-value-helper-text"
                    />
                </Box>
                <Box className="staking-input-box-inner">
                    <img src={logo} height={'40px'} width={'40px'} />
                </Box>
            </Box>
        </>
    );
};
export default StakingInput;
