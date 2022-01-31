import React from 'react';
import './styles.scss';
import {BrowserRouter as Router} from 'react-router-dom';
import {Route} from 'react-router';
import StakingZkpPage from './pages/StakingZkpPage';
import {ThemeProvider} from '@mui/material/styles';
import {createTheme} from '@mui/material';

const theme = createTheme({
    typography: {
        fontFamily: ['inter', 'sans-serif'].join(','),
        fontSize: 14,
        fontWeightRegular: 400,
    },
});

function getMissingEnvVars() {
    // Need this ludicrous check because due to a quirk of dotenv-webpack,
    // process.env[envVar] doesn't actually work:
    // https://github.com/mrsteele/dotenv-webpack/issues/70#issuecomment-392525509
    const _envCheck = {
        STAKING_CONTRACT: process.env.STAKING_CONTRACT,
        REWARD_MASTER_CONTRACT: process.env.REWARD_MASTER_CONTRACT,
        VESTING_POOLS_CONTRACT: process.env.VESTING_POOLS_CONTRACT,
        STAKING_TOKEN_CONTRACT: process.env.STAKING_TOKEN_CONTRACT,
        CHAIN_ID: process.env.CHAIN_ID,
    };
    const missing = [] as Array<string>;
    for (const [key, val] of Object.entries(_envCheck)) {
        if (!val) {
            missing.push(key);
        }
    }
    return missing;
}

function App() {
    const missing = getMissingEnvVars();
    if (missing.length > 0) {
        return (
            <div>
                <h1>Configuration Error</h1>
                <p>
                    Server is missing environment variable
                    {missing.length > 1 && 's'}: {missing.join(', ')}
                </p>
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
            <div className="App">
                <Router>
                    <Route path={'/'} exact={true} component={StakingZkpPage} />
                </Router>
            </div>
        </ThemeProvider>
    );
}

export default App;
