import React, {useCallback, useEffect, useState} from 'react';

import {Box, Card, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import polygonIcon from '../../images/polygon-logo.svg';
import {formatCurrency} from '../../lib/format';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {getChainBalance} from '../../redux/slices/chainBalance';
import {
    getZkpTokenBalance,
    zkpTokenBalanceSelector,
} from '../../redux/slices/zkpTokenBalance';
import {formatAccountAddress} from '../../services/account';
import {isWrongNetwork, supportedNetworks} from '../../services/connectors';
import {FAUCET_CHAIN_IDS} from '../../services/env';
import {sendFaucetTransaction} from '../../services/faucet';
import PrimaryActionButton from '../Common/PrimaryActionButton';
import ConnectButton from '../ConnectButton';
import SwitchNetworkButton from '../SwitchNetworkButton';

import './styles.scss';

function ZafariFaucet() {
    const context = useWeb3React();
    const {library, account, active, chainId} = context;
    const [wrongNetwork, setWrongNetwork] = useState(false);

    const dispatch = useAppDispatch();
    const tokenBalance = useAppSelector(zkpTokenBalanceSelector);

    const fetchZkpTokenBalance = useCallback(async () => {
        if (tokenBalance) {
            return;
        }
        dispatch(getZkpTokenBalance, context);
    }, [dispatch, context, tokenBalance]);

    useEffect((): void => {
        const wrongNetwork = isWrongNetwork(context, FAUCET_CHAIN_IDS);
        setWrongNetwork(wrongNetwork);
    }, [context]);

    useEffect(() => {
        if (!library || !account || !chainId) {
            return;
        }
        fetchZkpTokenBalance();
    }, [library, account, chainId, fetchZkpTokenBalance]);

    function networkName(chainId: number): React.ReactElement {
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
                {supportedNetworks[chainId].name}
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
                    {chainId && networkName(chainId)}
                </Box>
                <Box className="details-row">
                    <Typography id="caption">Token:</Typography>
                    <Typography id="token-symbol">$ZKP</Typography>
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
                        <SwitchNetworkButton
                            defaultNetwork={FAUCET_CHAIN_IDS[0]}
                        />
                    </Box>
                )}
                {!active && !wrongNetwork && <ConnectButton />}
                {active && !wrongNetwork && (
                    <PrimaryActionButton onClick={sendFaucet}>
                        <span>Request Test Tokens</span>
                    </PrimaryActionButton>
                )}
            </Box>
        </Card>
    );
}

export default ZafariFaucet;
