// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useCallback, useEffect} from 'react';

import {warningMessage} from 'constants/dev-tool-warning';
import {Routes} from 'constants/routes';

import {createTheme} from '@mui/material';
import {ThemeProvider} from '@mui/material/styles';
import 'lib/bigint-serialize';
import ContractsPage from 'pages/Contracts';
import Faucet from 'pages/Faucet';
import NotFoundPage from 'pages/NotFound';
import Staking from 'pages/Staking';
import ZAssets from 'pages/ZAssets';
import {ReactNotifications} from 'react-notifications-component';
import {Route} from 'react-router';
import {HashRouter as Router, Switch} from 'react-router-dom';
import {useAppDispatch} from 'redux/hooks';
import {getZKPTokenMarketPrice} from 'redux/slices/marketPrices/zkp-market-price';
import {getMissingEnvVars, env} from 'services/env';
import {isBlockedCountry} from 'services/geo-location';

import './styles.scss';

const theme = createTheme({
    typography: {
        fontFamily: ['Inter', 'sans-serif'].join(','),
        fontSize: 14,
        fontWeightRegular: 400,
    },
});

// Warning users from pasting malicious code in the console
console.log('%cStop!', 'color: red; font-size: 40px;');
console.log(`%c${warningMessage}`, 'line-height: 1.2; font-size: 16.5px;');

function App() {
    const missing = getMissingEnvVars();
    const dispatch = useAppDispatch();

    const checkIfBlocked = useCallback(async () => {
        const response = await isBlockedCountry();
        if (response instanceof Error) {
            console.error(`Failed to get geo-location data :  ${response}`);
        }
        console.log(
            `this user is ${response ? 'not' : ''} allowed to use the app`,
        );
    }, []);

    useEffect(() => {
        dispatch(getZKPTokenMarketPrice);
        checkIfBlocked();
    }, [checkIfBlocked, dispatch]);

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
                        component={Faucet}
                    />,
                ];

            default:
                return [
                    <Route
                        key="staking"
                        path={Routes.Staking}
                        exact={true}
                        component={Staking}
                    />,
                    <Route
                        key="zassets"
                        path={Routes.ZAssets}
                        exact={true}
                        component={ZAssets}
                    />,
                    <Route
                        key="faucet"
                        path={Routes.Faucet}
                        exact={true}
                        component={Faucet}
                    />,
                    <Route
                        key="contracts"
                        path={Routes.Contracts}
                        exact={true}
                        component={ContractsPage}
                    />,
                ];
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <ReactNotifications />
            <div className="App">
                <Router>
                    <Switch>
                        {...buildRouting()},
                        <Route component={NotFoundPage} />,
                    </Switch>
                </Router>
            </div>
        </ThemeProvider>
    );
}

export default App;
