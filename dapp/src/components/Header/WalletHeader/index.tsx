import React, {useCallback, useEffect, useState} from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import * as Sentry from '@sentry/browser';
import {useWeb3React} from '@web3-react/core';
import ConnectButton from 'components/ConnectButton';
import {NetworkButton} from 'components/NetworkButton';
import SwitchNetworkButton from 'components/SwitchNetworkButton';
import {WalletButton} from 'components/WalletButton';
import {useAppDispatch, useAppSelector} from 'redux/hooks';
import {isWalletConnectedSelector} from 'redux/slices/ui/is-wallet-connected';
import {getChainBalance} from 'redux/slices/wallet/chain-balance';
import {currentNetwork, isWrongNetwork, injected} from 'services/connectors';
import {CHAIN_IDS} from 'services/env';
import {switchNetwork} from 'services/wallet';

import './styles.scss';

export default function WalletHeader() {
    const dispatch = useAppDispatch();
    const context = useWeb3React();
    const {account, active, error, chainId, activate} = context;
    const [wrongNetwork, setWrongNetwork] = useState(false);

    const network = currentNetwork(chainId);

    const fetchChainBalance = useCallback(() => {
        dispatch(getChainBalance, context);
    }, [dispatch, context]);

    const isWalletConnected = useAppSelector(isWalletConnectedSelector);

    useEffect(() => {
        const connectWalletOnPageLoad = async () => {
            if (isWalletConnected) {
                try {
                    await activate(injected);
                } catch (ex) {
                    Sentry.captureException(ex);
                    console.error(ex);
                }
            }
        };
        connectWalletOnPageLoad();
    }, [activate, isWalletConnected]);

    useEffect((): void => {
        const wrongNetwork = isWrongNetwork(context, CHAIN_IDS);
        setWrongNetwork(wrongNetwork);

        if (!wrongNetwork && account) {
            fetchChainBalance();
        }
    }, [context, active, account, error, fetchChainBalance]);

    return (
        <Grid item lg={6} md={12} xs={12} className="wallet-header-container">
            {/* connection button */}
            {!active && !wrongNetwork && (
                <Box className="address-btn">
                    <ConnectButton />
                </Box>
            )}

            {wrongNetwork && (
                <Box className="address-btn">
                    <SwitchNetworkButton onChange={switchNetwork} />
                </Box>
            )}

            {active && !wrongNetwork && (
                <>
                    {network && (
                        <NetworkButton
                            networkName={network.name}
                            networkLogo={network.logo}
                        />
                    )}
                    <WalletButton />
                </>
            )}
        </Grid>
    );
}
