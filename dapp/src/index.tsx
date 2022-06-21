import React from 'react';

import {Web3Provider} from '@ethersproject/providers';
import {Web3ReactProvider} from '@web3-react/core';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';

import App from './App';
import {persistor, store} from './redux/store';
import reportWebVitals from './reportWebVitals';

import './styles.scss';

function getLibrary(provider: any): Web3Provider {
    const library = new Web3Provider(provider);
    library.pollingInterval = 12000;
    return library;
}

ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <Web3ReactProvider getLibrary={getLibrary}>
                    <App />
                </Web3ReactProvider>
            </PersistGate>
        </Provider>
    </React.StrictMode>,
    document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// @ts-ignore
module.hot.accept();
