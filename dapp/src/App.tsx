import React from 'react';

import {createTheme} from '@mui/material';
import {ThemeProvider} from '@mui/material/styles';
import {ReactNotifications} from 'react-notifications-component';
import {Route} from 'react-router';
import {BrowserRouter as Router} from 'react-router-dom';

import StakingZkpPage from './pages/StakingZkpPage';
import {getMissingEnvVars} from './services/env';

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

    return (
        <ThemeProvider theme={theme}>
            <ReactNotifications />
            <div className="App">
                <Router>
                    <Route path={'/'} exact={true} component={StakingZkpPage} />
                </Router>
            </div>
        </ThemeProvider>
    );
}

export default App;
