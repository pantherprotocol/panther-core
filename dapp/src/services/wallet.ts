import {utils} from 'ethers';

import {supportedNetworks} from './connectors';
import {openNotification} from './notification';

export const switchNetwork = async (
    chainId: number,
    errorHandler?: (msg: string) => void,
) => {
    const {ethereum} = window as any;
    const switchToChainId = utils.hexValue(chainId);
    const requiredNetwork = supportedNetworks[chainId];
    try {
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{chainId: switchToChainId}],
        });
    } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: switchToChainId,
                            rpcUrls: [requiredNetwork.rpcURL],
                            chainName: requiredNetwork.name,
                            nativeCurrency: {
                                name: requiredNetwork.name,
                                symbol: requiredNetwork.symbol,
                                decimals: requiredNetwork.decimals,
                            },
                            blockExplorerUrls: requiredNetwork.explorerURLs,
                        },
                    ],
                });
            } catch (addError: any) {
                console.error(addError);
                openNotification('Add token error', addError, 'danger');
                if (errorHandler) errorHandler(addError.message);
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
                    console.log('Please connect to MetaMask.');
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
