// SPDX-FileCopyrightText: 2021 Noah Zinsmeister
// SPDX-FileCopyrightText: 2021 Panther Protocol
//
// SPDX-License-Identifier: GPL-3.0
// derived from example provided at https://github.com/NoahZinsmeister/web3-react

import {useCallback} from 'react';

import {useWeb3React} from '@web3-react/core';

import {injected} from '../services/connectors';

export function useOnConnect() {
    const {error, chainId, activate, deactivate} = useWeb3React();

    return useCallback(async () => {
        console.debug('onConnect: error', error, '/ chainId', chainId);
        if (!chainId) {
            console.debug(
                'Connecting to the network; injected connector:',
                injected,
            );
            await activate(injected);
        } else {
            deactivate();
        }
    }, [error, chainId, activate, deactivate]);
}
