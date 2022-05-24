import React, {useState, useCallback, useEffect} from 'react';

import {createTheme} from '@mui/material';
import {ThemeProvider} from '@mui/material/styles';
import {useWeb3React} from '@web3-react/core';
import {ReactNotifications} from 'react-notifications-component';
import {Route, Redirect} from 'react-router';
import {BrowserRouter as Router} from 'react-router-dom';

import {useEagerConnect, useInactiveListener} from './hooks/web3';
import Faucet from './pages/Faucet';
import Staking from './pages/Staking';
import ZAssets from './pages/ZAssets';
import {injected, supportedNetworks, Network} from './services/connectors';
import {getMissingEnvVars, env} from './services/env';

import './styles.scss';

const theme = createTheme({
    typography: {
        fontFamily: ['Inter', 'sans-serif'].join(','),
        fontSize: 14,
        fontWeightRegular: 400,
    },
});

function App() {
    const context = useWeb3React();
    const {connector, chainId, activate, deactivate, error} = context;

    // Logic to recognize the connector currently being activated
    const [activatingConnector, setActivatingConnector] = useState<any>();

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

    const missing = getMissingEnvVars();

    if (missing.length > 0) {
        return (
            <div>
                <h1>Configuration Error</h1>
                <p>
                    Server is missing environment variable
                    {missing.length > 1 && 's'}:
                </p>
                <ul>
                    {missing.map(item => (
                        <li key={item}>
                            <code>{item}</code>
                        </li>
                    ))}
                </ul>
                <p>
                    Please configure <code>.env</code> correctly (use{' '}
                    <code>.env.example</code> as a base) and then restart the
                    app.
                </p>
            </div>
        );
    }

    function buildRouting(): React.ReactElement[] {
        switch (env.APP_MODE) {
            case 'faucet':
                return [
                    <Route
                        key="faucet"
                        path={'/'}
                        exact={true}
                        component={() => Faucet(onConnect, currentNetwork)}
                    />,
                ];

            default:
                return [
                    <Route
                        key="staking"
                        path={'/'}
                        exact={true}
                        component={() => Staking(onConnect, currentNetwork)}
                    />,
                    <Route
                        key="zassets"
                        path={'/zAssets'}
                        exact={true}
                        component={() => ZAssets(onConnect, currentNetwork)}
                    />,
                    <Route
                        key="faucet"
                        path={'/faucet'}
                        exact={true}
                        component={() => Faucet(onConnect, currentNetwork)}
                    />,
                ];
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <ReactNotifications />
            <div className="App">
                <Router>
                    {...buildRouting()}
                    <Route render={() => <Redirect to="/" />} />
                </Router>
            </div>
        </ThemeProvider>
    );
}

export default App;
