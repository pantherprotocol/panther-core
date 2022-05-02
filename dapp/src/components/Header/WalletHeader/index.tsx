import React, {useCallback, useEffect, useState} from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import {UnsupportedChainIdError, useWeb3React} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';

import {useAppDispatch} from '../../../redux/hooks';
import {getChainBalance} from '../../../redux/slices/chainBalance';
import {onWrongNetwork} from '../../../services/connectors';
import {CHAIN_IDS} from '../../../services/env';
import Address from '../../Address';
import {safeOpenMetamask} from '../../Common/links';
import {ConnectButton} from '../../ConnectButton';
import {NetworkButton} from '../../NetworkButton';
import {SettingsButton} from '../../SettingsButton';
import AccountBalance from '../AccountBalance';

import './styles.scss';

export default function WalletHeader(props: {
    onConnect: () => void;
    networkLogo?: string;
    networkName?: string;
    networkSymbol?: string;
    disconnect: () => void;
    switchNetwork: (chainId: number) => void;
}) {
    const {onConnect} = props;
    const dispatch = useAppDispatch();
    const context = useWeb3React();
    const {account, active, error, chainId} = context;
    const [wrongNetwork, setWrongNetwork] = useState(false);

    const isNoEthereumProviderError = error instanceof NoEthereumProviderError;

    const fetchChainBalance = useCallback(() => {
        dispatch(getChainBalance(context));
    }, [dispatch, context]);

    useEffect((): void => {
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
        if (!wrongNetwork && account) {
            fetchChainBalance();
        }
    }, [context, active, account, error, fetchChainBalance]);

    return (
        <Grid item lg={6} md={12} xs={12} className="header-right-container">
            {/* connection button */}
            {!active && !wrongNetwork && (
                <Box className="address-btn">
                    <ConnectButton
                        text={
                            isNoEthereumProviderError
                                ? 'Install MetaMask'
                                : 'Connect Wallet'
                        }
                        onClick={() => {
                            if (isNoEthereumProviderError) {
                                safeOpenMetamask();
                            } else {
                                onConnect();
                            }
                        }}
                    />
                </Box>
            )}

            {wrongNetwork && (
                <Box className="address-btn">
                    <ConnectButton
                        text={'Switch network'}
                        onClick={() => {
                            const chainIdToSwitch = chainId
                                ? chainId
                                : CHAIN_IDS[0];
                            props.switchNetwork(chainIdToSwitch);
                        }}
                    />
                </Box>
            )}

            {/* account details */}
            {active && !wrongNetwork && (
                <>
                    {props.networkName && props.networkLogo && (
                        <NetworkButton
                            networkName={props.networkName}
                            networkLogo={props.networkLogo}
                            switchNetwork={props.switchNetwork}
                        />
                    )}
                    <Box className="address-and-balance-holder">
                        <Address />
                        <Box>
                            <AccountBalance
                                networkSymbol={props.networkSymbol}
                            />
                        </Box>
                    </Box>
                </>
            )}

            {/* disconnection button */}
            {active && !wrongNetwork && (
                <Box>
                    <SettingsButton disconnect={props.disconnect} />
                </Box>
            )}
        </Grid>
    );
}
