import {useCallback, useEffect, useState} from 'react';
import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Input from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import {UnsupportedChainIdError, useWeb3React} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';
import {BigNumber, utils} from 'ethers';

import logo from '../../images/panther-logo.svg';
import {onWrongNetwork} from '../../services/connectors';
import * as stakingService from '../../services/staking';
import {formatCurrency, safeParseUnits} from '../../utils';
import {ConnectButton} from '../ConnectButton';

import './styles.scss';

// Minimum stake is fixed in classic staking terms; no need for a contract call.
const MINIMUM_STAKE = utils.parseUnits('100');

export default function StakeTab(props: {
    rewardsBalance: BigNumber | null;
    tokenBalance: BigNumber | null;
    stakedBalance: BigNumber | null;
    fetchData: () => Promise<void>;
    onConnect: any;
    switchNetwork: any;
}) {
    const context = useWeb3React();
    const {account, library, chainId, active, error} = context;
    const isNoEthereumProviderError = error instanceof NoEthereumProviderError;
    const [wrongNetwork, setWrongNetwork] = useState(false);
    const [amountToStake, setAmountToStake] = useState<string>('');
    const [amountToStakeBN, setAmountToStakeBN] = useState<BigNumber | null>(
        null,
    );
    const [, setStakedId] = useState<number | null>(null);

    // For use when user types input
    const setStakingAmount = useCallback((amount: string) => {
        setAmountToStake(amount);
        const bn = safeParseUnits(amount);
        if (bn) {
            setAmountToStakeBN(bn);
        }
    }, []);

    // For use when user clicks Max button
    const setStakingAmountBN = useCallback((amountBN: BigNumber) => {
        const amount = utils.formatEther(amountBN);
        setAmountToStake(amount);
        setAmountToStakeBN(amountBN);
    }, []);

    const stake = useCallback(
        async (amount: BigNumber) => {
            const stakingContract = await stakingService.getStakingContract(
                library,
            );
            if (!stakingContract || !account || !props.tokenBalance) {
                return;
            }

            const stakeType = '0x4ab0941a';
            const signer = library.getSigner(account).connectUnchecked();
            const stakingResponse = await stakingService.stake(
                library,
                chainId,
                account,
                stakingContract,
                signer,
                amount,
                stakeType,
            );

            if (stakingResponse instanceof Error) {
                return;
            }
            setStakedId(Number(stakingResponse));
            setStakingAmount('');
            props.fetchData();
        },
        [library, account, chainId, props, setStakingAmount],
    );

    useEffect((): any => {
        const wrongNetwork =
            onWrongNetwork(context) || error instanceof UnsupportedChainIdError;
        setWrongNetwork(wrongNetwork);
        console.debug(
            'header: wrongNetwork',
            wrongNetwork,
            '/ active',
            active,
            '/ error',
            error,
        );
        if (wrongNetwork) {
            return;
        }

        if (account && library) {
            let stale = false;

            library.getBalance(account).then(() => {
                if (!stale) {
                    setWrongNetwork(onWrongNetwork(context));
                }
            });

            return () => {
                stale = true;
            };
        }
    }, [context, active, account, library, error]);

    return (
        <Box className="staking-tab-holder">
            <StakingInput
                tokenBalance={props.tokenBalance}
                setStakingAmount={setStakingAmount}
                setStakingAmountBN={setStakingAmountBN}
                amountToStake={amountToStake}
            />
            <Card variant="outlined" className="staking-info-card">
                <CardContent>
                    <StakingInfoMSG />
                    {/* <Box display={'flex'} justifyContent={'center'}> */}
                    <StakingMethod />
                    {/* </Box> */}
                </CardContent>
            </Card>

            {wrongNetwork && (
                <div className="buttons-holder">
                    <ConnectButton
                        text={'Switch network'}
                        onClick={() => {
                            props.switchNetwork();
                        }}
                    />
                </div>
            )}

            {!active && !wrongNetwork && (
                <div className="buttons-holder">
                    <ConnectButton
                        text={
                            isNoEthereumProviderError
                                ? 'Install MetaMask'
                                : 'Connect Wallet'
                        }
                        onClick={() => {
                            if (isNoEthereumProviderError) {
                                window.open('https://metamask.io');
                            } else {
                                props.onConnect();
                            }
                        }}
                    />
                </div>
            )}

            {active && !wrongNetwork && (
                <StakingBtn
                    amountToStake={amountToStake}
                    amountToStakeBN={amountToStakeBN}
                    tokenBalance={props.tokenBalance}
                    stake={stake}
                />
            )}
        </Box>
    );
}

const getButtonText = (
    amount: string | null,
    amountBN: BigNumber | null,
    tokenBalance: BigNumber | null,
): [string, boolean] => {
    if (!tokenBalance) {
        return ["Couldn't get token balance", false];
    }
    if (!amount || !amountBN) {
        return ['Enter amount to stake above', false];
    }
    if (amountBN.gt(tokenBalance)) {
        console.debug(
            'Insufficient balance:',
            utils.formatEther(amountBN),
            '>',
            utils.formatEther(tokenBalance),
        );
        return ['Insufficient balance', false];
    }
    if (amountBN.gte(MINIMUM_STAKE)) {
        console.debug(
            'Sufficient balance:',
            utils.formatEther(amountBN),
            amountBN.eq(tokenBalance) ? '==' : '<=',
            utils.formatEther(tokenBalance),
        );
        // We display amount rather than stringifying amountBN, because we want
        // to make sure we display the same amount which is visible in the
        // staking amount field, and this is not guaranteed to be the same
        // due to rounding discrepancies, e.g. if Max button is clicked.
        return [`STAKE ${amount} ZKP`, true];
    }
    console.debug('Below minimum stake amount:', utils.formatEther(amountBN));
    return ['Stake amount must be above 100', false];
};

const StakingBtn = (props: {
    amountToStake: string | null;
    amountToStakeBN: BigNumber | null;
    tokenBalance: BigNumber | null;
    stake: (amount: BigNumber) => Promise<void>;
}) => {
    const [buttonText, ready] = getButtonText(
        props.amountToStake,
        props.amountToStakeBN,
        props.tokenBalance,
    );
    const activeClass = ready ? 'active' : '';
    return (
        <Box className={`buttons-holder ${activeClass}`}>
            <Button
                className="staking-button"
                onClick={() => {
                    if (ready && props.amountToStakeBN) {
                        props.stake(props.amountToStakeBN);
                    }
                }}
            >
                {buttonText}
            </Button>
        </Box>
    );
};

const StakingInput = (props: {
    tokenBalance: BigNumber | null;
    amountToStake: string | null;
    setStakingAmount: (amount: string) => void;
    setStakingAmountBN: (amount: BigNumber) => void;
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
                </span>
            </Box>
            <Box className="staking-input-container">
                <Box className="staking-input-box">
                    <Box>
                        <img src={logo} height={'40px'} width={'40px'} />
                    </Box>

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
                                <span>ZKP</span>
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
                        if (props.tokenBalance) {
                            props.setStakingAmountBN(props.tokenBalance);
                        }
                    }}
                >
                    MAX
                </Typography>
            </Box>
        </>
    );
};

const StakingMethod = () => (
    <Box className="staking-method-container">
        <Box
            display="flex"
            justifyContent={'space-between'}
            alignItems={'center'}
        >
            <Typography className="staking-method-title">
                Staking Method:
            </Typography>
            <Select
                labelId="staking-method-select-label"
                id="staking-method-selectd"
                variant="standard"
                value={'Standard'}
                className="staking-method-select"
            >
                <MenuItem selected value={'Standard'}>
                    Standard
                </MenuItem>
                <MenuItem value={'Advanced'} disabled={true}>
                    Advanced
                </MenuItem>
            </Select>
        </Box>
    </Box>
);

const StakingInfoMSG = () => (
    <Box className="staking-info-container">
        <Typography variant="subtitle2" className="staking-info-title">
            Staking will lock your tokens for a minimum of 7 days
        </Typography>
        <Typography className="staking-info-text">
            You will need to unstake to collect your rewards. Rewards are not
            automatically staked. Unstaking is available after 7 days.
        </Typography>
    </Box>
);
