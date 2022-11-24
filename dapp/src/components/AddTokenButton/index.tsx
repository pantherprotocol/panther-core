// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useCallback} from 'react';

import * as Sentry from '@sentry/browser';
import {useWeb3React} from '@web3-react/core';
import {openNotification} from 'components/Common/notification';
import {WalletHeaderActionButton} from 'components/Common/WalletHeaderActionButton';
import metamaskIcon from 'images/meta-mask-icon.svg';
import logo from 'images/panther-logo.svg';
import {DECIMALS} from 'lib/constants';
import {getTokenContract} from 'services/contracts';

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
            Sentry.captureException(switchError);
            console.error(switchError);
        }
    }, [library, chainId]);

    return (
        <WalletHeaderActionButton
            data-testid="add-token-button_add-token-button_wrapper"
            text="Add ZKP token"
            onClick={addZKPToken}
            logo={{src: metamaskIcon, alt: 'Metamask logo'}}
        />
    );
};
