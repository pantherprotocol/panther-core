import React, {useCallback, useEffect, useState} from 'react';

import {Box, Button, Card, Typography} from '@mui/material';
import {UnsupportedChainIdError, useWeb3React} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';

import polygonIcon from '../../images/polygon-logo.svg';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {getChainBalance} from '../../redux/slices/chainBalance';
import {
    getZkpTokenBalance,
    zkpTokenBalanceSelector,
} from '../../redux/slices/zkpTokenBalance';
import {formatAccountAddress} from '../../services/account';
import {
    onWrongFaucetNetwork,
    supportedNetworks,
} from '../../services/connectors';
import {FAUCET_CHAIN_IDS} from '../../services/env';
import {sendFaucetTransaction} from '../../services/faucet';
import {switchNetwork} from '../../services/wallet';
import {formatCurrency} from '../../utils/helpers';
import {safeOpenMetamask} from '../Common/links';
import {ConnectButton} from '../ConnectButton';

import './styles.scss';

function ZafariFaucet(props: {onConnect: () => void}) {
    const {onConnect} = props;
    const context = useWeb3React();
    const {account, active, library, error, chainId} = context;
    const isNoEthereumProviderError = error instanceof NoEthereumProviderError;
    const [wrongNetwork, setWrongNetwork] = useState(false);

    const dispatch = useAppDispatch();
    const tokenBalance = useAppSelector(zkpTokenBalanceSelector);

    useEffect((): void => {
        const wrongNetwork =
            onWrongFaucetNetwork(context) ||
            error instanceof UnsupportedChainIdError;
        setWrongNetwork(wrongNetwork);
        console.debug(
            'header: wrongNetwork',
            wrongNetwork,
            '/ active',
            active,
            '/ error',
            error,
        );
    }, [context, active, account, error]);

    function networkName(): React.ReactElement {
        if (!active) {
            return <Typography id="value">Not connected</Typography>;
        }

        if (wrongNetwork) {
            return (
                <Typography id="value">
                    Please, switch to{' '}
                    {supportedNetworks[FAUCET_CHAIN_IDS[0]].name}
                </Typography>
            );
        }

        return (
            <Typography id="value">
                <img src={polygonIcon} id="polygon-icon" />
                Mumbai
            </Typography>
        );
    }

    const sendFaucet = useCallback(async () => {
        if (!chainId || !account) {
            return;
        }

        const faucetResponse = await sendFaucetTransaction(
            library,
            chainId,
            account,
        );

        dispatch(getChainBalance, context);
        dispatch(getZkpTokenBalance, context);

        if (faucetResponse instanceof Error) {
            return;
        }
    }, [context, dispatch, library, chainId, account]);

    return (
        <Card className="zafari-faucet-container">
            <Typography id="title">Get Test Tokens</Typography>
            <Typography id="welcome-message">
                Welcome to Panther Protocol’s incentivized testnet! You can
                claim your test tokens here!
            </Typography>
            <Card className="details">
                <Box className="details-row">
                    <Typography id="caption">Network:</Typography>
                    {networkName()}
                </Box>
                <Box className="details-row">
                    <Typography id="caption">Token:</Typography>
                    <Typography id="token-symbol">$TESTZKP</Typography>
                </Box>
                <Box className="details-row">
                    <Typography id="caption">Balance:</Typography>
                    <Typography id="token-balance">
                        {formatCurrency(tokenBalance)}
                    </Typography>
                </Box>
                <Box className="details-row">
                    <Typography id="caption">Wallet Address:</Typography>
                    {!active && (
                        <Typography id="value">Wallet not connected</Typography>
                    )}
                    {active && !wrongNetwork && (
                        <Typography id="value">
                            {formatAccountAddress(account)}
                        </Typography>
                    )}
                </Box>
            </Card>
            <Box className="connect-button">
                {wrongNetwork && (
                    <Box>
                        <ConnectButton
                            text={'Switch network'}
                            onClick={() => {
                                switchNetwork(FAUCET_CHAIN_IDS[0]);
                            }}
                        />
                    </Box>
                )}
                {!active && !wrongNetwork && (
                    <ConnectButton
                        text={
                            isNoEthereumProviderError
                                ? 'Install MetaMask'
                                : 'Connect Wallet to Start'
                        }
                        onClick={() => {
                            if (isNoEthereumProviderError) {
                                safeOpenMetamask();
                            } else {
                                onConnect();
                            }
                        }}
                    />
                )}
                {active && !wrongNetwork && (
                    <Button
                        className="send-faucet-btn"
                        onClick={() => {
                            sendFaucet();
                        }}
                    >
                        Request Test Tokens
                    </Button>
                )}
            </Box>
        </Card>
    );
}

export default ZafariFaucet;
