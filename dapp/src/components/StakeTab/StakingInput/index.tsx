import * as React from 'react';
import {useState} from 'react';

import {Box, Input, InputAdornment, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {BigNumber, utils} from 'ethers';

import logo from '../../../images/panther-logo.svg';
import {formatCurrency} from '../../../lib/format';
import {useAppSelector} from '../../../redux/hooks';
import {isStakingOpenSelector} from '../../../redux/slices/stakeTerms';
import {zkpTokenBalanceSelector} from '../../../redux/slices/zkpTokenBalance';
import {currentNetwork} from '../../../services/connectors';
import {StakeType} from '../../../types/staking';
import {networkLogo} from '../../Common/NetworkLogo';

import './styles.scss';

export default function StakingInput(props: {
    amountToStake: string | null;
    setStakingAmount: (amount: string) => void;
    setStakingAmountBN: (amount: BigNumber) => void;
}) {
    const context = useWeb3React();
    const {account, chainId} = context;

    const [inputTextLength, setInputTextLength] = useState<number>(0);
    const tokenBalance = useAppSelector(zkpTokenBalanceSelector);
    const isStakingOpen = useAppSelector(
        isStakingOpenSelector(chainId, StakeType.Advanced),
    );
    const disabled = !account || !isStakingOpen;

    const network = currentNetwork(chainId);

    const changeHandler = (e: any) => {
        setInputTextLength(e.target.value.length);

        const regex = /^\d*\.?\d*$/; // matches floating points numbers
        if (!regex.test(e.target.value)) {
            return false;
        }
        if (tokenBalance && Number(tokenBalance)) {
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
                        {tokenBalance ? formatCurrency(tokenBalance) : '-'}
                    </Typography>
                    <Typography
                        className="token-balance"
                        variant="subtitle2"
                        component="span"
                    >
                        ZKP
                    </Typography>
                </span>
            </Box>
            <Box className="staking-input-container">
                <Box className="staking-input-box">
                    <Input
                        inputProps={{
                            pattern: '[0-9.]*',
                            inputMode: 'decimal',
                            maxLength: 28,
                        }}
                        className={`staking-input ${
                            Math.floor(inputTextLength / 15) ? 'long-input' : ''
                        }`}
                        value={props.amountToStake}
                        onChange={changeHandler}
                        autoComplete="off"
                        autoFocus={true}
                        placeholder="0.0"
                        disableUnderline={true}
                        disabled={disabled}
                        endAdornment={
                            <InputAdornment
                                position="end"
                                className="staking-input-symbol"
                            >
                                <span className="staking-symbol-holder">
                                    {network?.logo && (
                                        <img
                                            src={networkLogo(network.logo)}
                                            alt="Network logo"
                                        />
                                    )}
                                    <span>ZKP</span>
                                </span>
                            </InputAdornment>
                        }
                        aria-describedby="staking-value-helper-text"
                    />
                </Box>
                <Typography
                    variant="caption"
                    component="span"
                    className="staking-input-max"
                    onClick={() => {
                        if (tokenBalance) {
                            props.setStakingAmountBN(tokenBalance);
                            setInputTextLength(
                                utils.formatEther(tokenBalance).length,
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
        </>
    );
}
