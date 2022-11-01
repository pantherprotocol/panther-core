import React, {useCallback, useEffect} from 'react';

import {createTheme} from '@mui/material';
import {ThemeProvider} from '@mui/material/styles';
import {ReactNotifications} from 'react-notifications-component';
import {Route} from 'react-router';
import {HashRouter as Router, Switch} from 'react-router-dom';

import {isBlockedCountry} from '../src/services/geo-location';

import './lib/bigint-serialize';
import ContractsPage from './pages/Contracts';
import Faucet from './pages/Faucet';
import NotFoundPage from './pages/NotFound';
import Staking from './pages/Staking';
import ZAssets from './pages/ZAssets';
import {useAppDispatch} from './redux/hooks';
import {getZKPTokenMarketPrice} from './redux/slices/marketPrices/zkpMarketPrice';
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
                        path={'/'}
                        exact={true}
                        component={Staking}
                    />,
                    <Route
                        key="zassets"
                        path={'/zAssets'}
                        exact={true}
                        component={ZAssets}
                    />,
                    <Route
                        key="faucet"
                        path={'/faucet'}
                        exact={true}
                        component={Faucet}
                    />,
                    <Route
                        key="contracts"
                        path={'/contracts'}
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
