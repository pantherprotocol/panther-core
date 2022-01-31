import * as React from 'react';
import {useState, useEffect} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {IconButton, Tooltip} from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/Input';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import {UnsupportedChainIdError, useWeb3React} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';

import warningIcon from '../../images/warning-icon.svg';
import logo from '../../images/panther-logo.svg';

import * as stakingService from '../../services/staking';
import {SafeMuiLink} from '../../services/links';
import {onWrongNetwork} from '../../services/connectors';

import {ConnectButton} from '../ConnectButton';

import './styles.scss';

export default function StakeTab(props: {
    rewardsBalance: string | null;
    tokenBalance: string | null;
    stakedBalance: string | null;
    setZkpTokenBalance: any;
    getStakedZkpBalance: any;
    onConnect: any;
    switchNetwork: any;
}) {
    const context = useWeb3React();
    const {account, library, active, error} = context;
    const isNoEthereumProviderError = error instanceof NoEthereumProviderError;
    const [wrongNetwork, setWrongNetwork] = useState(false);
    const [amountToStake, setAmountToStake] = useState<string | null>('0');
    const [, setStakedId] = useState<number | null>(null);

    const stake = async (amount: string) => {
        const stakingContract = await stakingService.getStakingContract(
            library,
        );
        if (!stakingContract) {
            return;
        }
        const stakeType = '0x4ab0941a';
        const signer = library.getSigner(account).connectUnchecked();
        const stakingResponse = await stakingService.stake(
            library,
            stakingContract,
            amount,
            stakeType,
            signer,
        );
        if (stakingResponse instanceof Error) {
            //TODO: Popup notification and return data
            console.error(stakingResponse);
        }
        setStakedId(Number(stakingResponse));
        props.setZkpTokenBalance();
        props.getStakedZkpBalance();
    };

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
        <Box width={'100%'}>
            <StakingInput
                tokenBalance={props.tokenBalance}
                setAmountToStake={setAmountToStake}
                amountToStake={amountToStake}
            />
            <Card
                variant="outlined"
                sx={{
                    backgroundColor: '#2B334140',
                    borderRadius: '8px',
                    margin: '24px 0',
                }}
            >
                <CardContent className="staking-info-card">
                    <StakingInfoMSG />
                    <Box display={'flex'} justifyContent={'center'}>
                        <StakingMethod />
                    </Box>
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
                <StakingBtn amountToStake={amountToStake} stake={stake} />
            )}
        </Box>
    );
}

const StakingBtn = ({amountToStake, stake}) => {
    return (
        <CardActions
            sx={{
                padding: '0',
            }}
        >
            <Box className="staking-button">
                <Button
                    className="stake-button"
                    onClick={() => {
                        if (amountToStake && Number(amountToStake) > 0) {
                            stake(amountToStake);
                        }
                    }}
                >
                    Stake{' '}
                    {amountToStake && Number(amountToStake) > 0
                        ? amountToStake
                        : ''}{' '}
                    ZKP
                </Button>
            </Box>
        </CardActions>
    );
};

const StakingInput = props => {
    const {tokenBalance, setAmountToStake, amountToStake} = props;
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
                        {tokenBalance}
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
                        className="staking-input"
                        value={amountToStake}
                        onChange={e => {
                            const regex = /^\d*\.?\d*$/; // matches floating points numbers
                            if (
                                tokenBalance &&
                                Number(tokenBalance) &&
                                Number(e.target.value) > Number(tokenBalance) &&
                                regex.test(e.target.value)
                            ) {
                                return null;
                            } else if (regex.test(e.target.value)) {
                                setAmountToStake(
                                    e.target.value.toString() || '',
                                );
                            } else {
                                setAmountToStake('');
                            }
                        }}
                        autoComplete="off"
                        autoFocus={true}
                        placeholder={amountToStake ? amountToStake : ''}
                        disableUnderline={true}
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
                        setAmountToStake(tokenBalance);
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
        <Box display="flex" justifyContent={'space-between'}>
            <Typography className="staking-method-title">
                Estimated Gas Fee:
            </Typography>
            <Typography className="staking-method-estimated-gas-fee">
                0.0001 ETH
            </Typography>
        </Box>
    </Box>
);

const StakingInfoMSG = () => (
    <Box className="staking-info-container">
        <Box className="staking-info-title">
            <Tooltip title={'warning'} placement="top" className="icon">
                <IconButton>
                    <img src={warningIcon} />
                </IconButton>
            </Tooltip>

            <Typography variant="subtitle2">
                Staking will lock your tokens for 7+ days
            </Typography>
        </Box>
        <Typography className="staking-info-text">
            You will need to unstake in order for your staked assets to be
            liquid again. This process will take 7 days to complete.{' '}
            <SafeMuiLink
                href="https://docs.pantherprotocol.io/panther-dao-and-zkp/support/faq/staking-faq"
                underline="always"
                color="inherit"
            >
                Learn more
            </SafeMuiLink>
        </Typography>
    </Box>
);
