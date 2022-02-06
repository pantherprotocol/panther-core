// SPDX-FileCopyrightText: 2021 Noah Zinsmeister
// SPDX-FileCopyrightText: 2021 Panther Protocol
//
// SPDX-License-Identifier: GPL-3.0
// derived from example provided at https://github.com/NoahZinsmeister/web3-react

import {useState, useEffect} from 'react';

import {Contract} from '@ethersproject/contracts';
import {useWeb3React, UnsupportedChainIdError} from '@web3-react/core';
import {
    NoEthereumProviderError,
    UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';

import {injected} from '../services/connectors';

export function useEagerConnect() {
    const {activate, active} = useWeb3React();

    const [tried, setTried] = useState(false);

    useEffect(() => {
        injected.isAuthorized().then((isAuthorized: boolean) => {
            if (isAuthorized) {
                activate(injected, undefined, true).catch(() => {
                    setTried(true);
                });
            } else {
                setTried(true);
            }
        });
    }, [activate]); // intentionally only running on mount (make sure it's only mounted once :))

    // if the connection worked, wait until we get confirmation of that to flip the flag
    useEffect(() => {
        if (!tried && active) {
            setTried(true);
        }
    }, [tried, active]);

    return tried;
}

export function useInactiveListener(suppress = false) {
    const {active, error, activate} = useWeb3React();

    useEffect((): any => {
        if (suppress) {
            // console.debug('web3: listeners suppressed');
            return;
        }
        const {ethereum} = window as any;
        if (!ethereum) {
            console.debug("web3: No window ethereum; can't set up listeners");
            return;
        }
        if (!ethereum.on) {
            console.debug(
                "web3: No window ethereum.on; can't set up listeners",
            );
            return;
        }
        if (!active) {
            console.debug("web3: No account active; won't set up listeners");
            return;
        }
        if (error) {
            console.debug(
                "web3: web3-react error; won't set up listeners",
                error,
            );
            return;
        }
        const handleConnect = () => {
            console.debug("web3: Handling 'connect' event");
            activate(injected);
        };
        const handleChainChanged = (chainId: string | number) => {
            console.debug(
                "web3: Handling 'chainChanged' event with payload",
                chainId,
            );
            activate(injected);
        };
        const handleAccountsChanged = (accounts: string[]) => {
            console.debug(
                "web3: Handling 'accountsChanged' event with payload",
                accounts,
            );
            if (accounts.length > 0) {
                activate(injected);
            }
        };
        const handleNetworkChanged = (networkId: string | number) => {
            console.debug(
                "web3: Handling 'networkChanged' event with payload",
                networkId,
            );
            activate(injected);
        };

        ethereum.on('connect', handleConnect);
        ethereum.on('chainChanged', handleChainChanged);
        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('networkChanged', handleNetworkChanged);

        return () => {
            if (ethereum.removeListener) {
                ethereum.removeListener('connect', handleConnect);
                ethereum.removeListener('chainChanged', handleChainChanged);
                ethereum.removeListener(
                    'accountsChanged',
                    handleAccountsChanged,
                );
                ethereum.removeListener('networkChanged', handleNetworkChanged);
                console.debug('web3: removed ethereum listeners');
            }
        };
    }, [active, error, suppress, activate]);
}

export function getConnectionErrorMessage(error: Error) {
    if (error instanceof NoEthereumProviderError) {
        return 'Install wallet';
    } else if (error instanceof UnsupportedChainIdError) {
        return 'Switch network';
    } else if (error instanceof UserRejectedRequestErrorInjected) {
        return 'Connect wallet';
    } else {
        console.error(error);
        return 'Unknown error';
    }
}

export function useBlockNumber() {
    const {library} = useWeb3React();
    const [blockNumber, setBlockNumber] = useState(-1);
    useEffect(() => {
        if (!library) {
            return;
        }
        const t = setInterval(async () => {
            try {
                setBlockNumber(await library.getBlockNumber());
            } catch (ex) {
                console.error('failed to get block number', ex);
            }
            return () => {
                clearInterval(t);
            };
        }, 1000);
    }, [library]);
    return blockNumber;
}

export function useContract(contractJson) {
    const {chainId, library, account} = useWeb3React();
    if (!chainId || !contractJson.networks || !contractJson.networks[chainId]) {
        return null;
    }
    const signer = library.getSigner(account).connectUnchecked();
    return new Contract(
        contractJson.networks[chainId].address,
        contractJson.abi,
        signer,
    );
}

export function useContractCallData(contract, methodName, args) {
    const blockNumber = useBlockNumber();
    const [result, setResult] = useState(null);
    // @ts-ignore
    useEffect(() => {
        if (!contract || !methodName) {
            return null;
        }
        async function loadData() {
            try {
                const result = await contract[methodName](...args);
                setResult(result);
            } catch (ex) {
                console.log(`failed call contract method ${methodName}: `, ex);
            }
        }
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blockNumber, args, contract, methodName]);
    return result;
}
