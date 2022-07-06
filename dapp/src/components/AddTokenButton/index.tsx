import React, {useCallback} from 'react';

import {useWeb3React} from '@web3-react/core';

import metamaskIcon from '../../images/meta-mask-icon.svg';
import logo from '../../images/panther-logo.svg';
import {DECIMALS} from '../../lib/constants';
import {getTokenContract} from '../../services/contracts';
import {openNotification} from '../../services/notification';
import {WalletHeaderActionButton} from '../Common/WalletHeaderActionButton';

export const AddTokenButton = () => {
    const context = useWeb3React();
    const {library, chainId} = context;

    const addZKPToken = useCallback(async () => {
        const {ethereum} = window as any;

        if (!library || !chainId) return;
        const tokenContract = getTokenContract(library, chainId);
        const tokenSymbol = await tokenContract.symbol();

        try {
            await ethereum
                .request({
                    method: 'wallet_watchAsset',
                    params: {
                        type: 'ERC20',
                        options: {
                            address: tokenContract.address,
                            symbol: tokenSymbol,
                            decimals: DECIMALS,
                            image: logo,
                        },
                    },
                })
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
        }
    }, [library, chainId]);

    return (
        <WalletHeaderActionButton
            text="Add ZKP token"
            onClick={addZKPToken}
            logo={{src: metamaskIcon, alt: 'Metamask logo'}}
        />
    );
};
