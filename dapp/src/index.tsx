// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {CaptureConsole} from '@sentry/integrations';
import * as Sentry from '@sentry/react';
import {BrowserTracing} from '@sentry/tracing';
import {Web3ReactProvider} from '@web3-react/core';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {persistor, store} from 'redux/store';
import {PersistGate} from 'redux-persist/integration/react';
import {getLibrary} from 'services/provider';

import App from './App';
import reportWebVitals from './reportWebVitals';

import './styles.scss';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
        new BrowserTracing(),
        new CaptureConsole({
            levels: ['error'],
        }),
    ],
    tracesSampleRate: 1.0,
    enabled: process.env.NODE_ENV !== 'development',
});

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
