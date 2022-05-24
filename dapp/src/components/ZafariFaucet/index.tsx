import React, {useEffect, useState} from 'react';

import {Box, Button, Card, Typography} from '@mui/material';
import {UnsupportedChainIdError, useWeb3React} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';

import polygonIcon from '../../images/polygon-logo.svg';
import {formatAccountAddress} from '../../services/account';
import {
    onWrongFaucetNetwork,
    supportedNetworks,
} from '../../services/connectors';
import {FAUCET_CHAIN_IDS} from '../../services/env';
import {switchNetwork} from '../../services/wallet';
import {safeOpenMetamask} from '../Common/links';
import {ConnectButton} from '../ConnectButton';

import './styles.scss';

function ZafariFaucet(props: {onConnect: () => void; sendFaucet: () => void}) {
    const {onConnect, sendFaucet} = props;
    const context = useWeb3React();
    const {account, active, error} = context;
    const isNoEthereumProviderError = error instanceof NoEthereumProviderError;
    const [wrongNetwork, setWrongNetwork] = useState(false);

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
                        Send Test Tokens
                    </Button>
                )}
            </Box>
        </Card>
    );
}

export default ZafariFaucet;
