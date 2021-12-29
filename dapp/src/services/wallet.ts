import {CHAIN_HEX_ID, requiredNetwork, suggestedRpcURL} from './connectors';

export const switchNetwork = async (errorHandler?: (msg: string) => void) => {
    const {ethereum} = window as any;
    try {
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{chainId: CHAIN_HEX_ID}],
        });
    } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: CHAIN_HEX_ID,
                            rpcUrls: [suggestedRpcURL],
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
                }
            });
    } catch (switchError) {
        console.error(switchError);
    }
};
