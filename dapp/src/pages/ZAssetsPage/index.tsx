import React, {useCallback, useEffect, useState} from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import {Box} from '@mui/system';
import {useWeb3React} from '@web3-react/core';

import {Footer} from '../../components/Footer';
import Header from '../../components/Header';
import ZAssets from '../../components/ZAssets';
import {useEagerConnect, useInactiveListener} from '../../hooks/web3';
import background from '../../images/background.png';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {getAssets} from '../../redux/slices/assets';
import {blurSelector} from '../../redux/slices/blur';
import {injected, Network, supportedNetworks} from '../../services/connectors';
import {switchNetwork} from '../../services/wallet';

import './styles.scss';

const ZAssetsPage = () => {
    const context = useWeb3React();
    const dispatch = useAppDispatch();

    const {connector, chainId, activate, deactivate, error} = context;

    // Logic to recognize the connector currently being activated
    const [activatingConnector, setActivatingConnector] = useState<any>();
    const [, setChainError] = useState('');

    // Handle logic to eagerly connect to the injected ethereum provider, if it
    // exists and has granted access already
    const triedEager = useEagerConnect();

    useEffect(() => {
        if (activatingConnector && activatingConnector === connector) {
            setActivatingConnector(undefined);
        }
    }, [activatingConnector, connector]);

    // Set up listeners for events on the injected ethereum provider, if it exists
    // and is not in the process of activating.
    const suppressInactiveListeners =
        !triedEager || activatingConnector || error;
    useInactiveListener(suppressInactiveListeners);

    const currentNetwork: Network | null =
        context && context.chainId ? supportedNetworks[context.chainId] : null;

    const onConnect = useCallback(async () => {
        console.debug('onConnect: error', error, '/ chainId', chainId);
        if (!chainId) {
            console.debug(
                'Connecting to the network; injected connector:',
                injected,
            );
            setActivatingConnector(injected);
            await activate(injected);
        } else {
            deactivate();
        }
    }, [error, chainId, activate, deactivate]);
    const isBlur = useAppSelector(blurSelector);

    useEffect(() => {
        dispatch(getAssets, context);
    }, [context, dispatch]);

    return (
        <Box
            className={`main-app zAssets-main-page ${isBlur && 'isBlur'}`}
            sx={{
                backgroundImage: `url(${background})`,
            }}
        >
            <CssBaseline />
            <Header
                onConnect={() => {
                    onConnect();
                }}
                switchNetwork={(chainId: number) => {
                    switchNetwork(chainId, setChainError);
                }}
                networkName={currentNetwork?.name}
                networkSymbol={currentNetwork?.symbol}
                networkLogo={currentNetwork?.logo}
            />
            <Box className="main-box-holder">
                <ZAssets />
            </Box>
            <Footer />
        </Box>
    );
};

export default ZAssetsPage;
