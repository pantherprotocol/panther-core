// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {openNotification} from 'components/common/notification';
import {utils} from 'ethers';
import {supportedNetworks} from 'services/connectors';

export const switchNetwork = async (
    chainId: number,
    errorHandler?: (msg: string) => void,
) => {
    const {ethereum} = window as any;
    const switchToChainId = utils.hexValue(chainId);
    const requiredNetwork = supportedNetworks[chainId];
    try {
        console.debug(
            `Trying wallet_switchEthereumChain with chainId=${switchToChainId}`,
        );
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{chainId: switchToChainId}],
        });
        console.debug('wallet_switchEthereumChain succeeded');
    } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                // https://docs.metamask.io/guide/rpc-api.html#unrestricted-methods
                const chainParams = {
                    chainId: switchToChainId,
                    rpcUrls: [requiredNetwork.rpcURL],
                    chainName: requiredNetwork.name,
                    nativeCurrency: {
                        name: requiredNetwork.name,
                        symbol: requiredNetwork.symbol,
                        decimals: requiredNetwork.decimals,
                    },
                    blockExplorerUrls: requiredNetwork.explorerURLs,
                };
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [chainParams],
                });
            } catch (addError: any) {
                console.error(
                    'Got error from wallet_addEthereumChain:',
                    addError,
                );
                let errorMsg = addError.message;
                if (
                    errorMsg.includes(
                        'Expected an array with at least one valid string HTTPS url',
                    ) &&
                    requiredNetwork.rpcURL.startsWith('http://')
                ) {
                    errorMsg =
                        'You have hit a MetaMask bug! ' +
                        'See https://github.com/MetaMask/metamask-extension/issues/14416';
                }
                openNotification('Error switching network', errorMsg, 'danger');
                if (errorHandler) errorHandler(errorMsg);
            }
        }
    }
};

export const changeWallet = async (accountToSwitch: string) => {
    console.debug(`Requesting switch to ${accountToSwitch}`);
    const {ethereum} = window as any;
    try {
        await ethereum
            .request({
                method: 'wallet_requestPermissions',
                params: [
                    {
                        eth_accounts: {accountToSwitch},
                    },
                ],
            })
            .then()
            .catch((error: any) => {
                if (error.code === 4001) {
                    console.error('Please connect to MetaMask.');
                } else {
                    console.error(error);
                    openNotification(
                        'Metamask error',
                        'Please connect to MetaMask.',
                        'danger',
                    );
                }
            });
    } catch (switchError) {
        console.error(switchError);
        openNotification('Switch wallet error', 'Please try again.', 'danger');
    }
};
