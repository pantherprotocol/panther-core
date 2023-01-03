// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useCallback} from 'react';

import {useWeb3React} from '@web3-react/core';
import {addressLink, safeWindowOpen} from 'components/common/links';
import {WalletHeaderActionButton} from 'components/common/WalletHeaderActionButton';
import etherscanIcon from 'images/etherscan-icon.svg';
import {ContractName, getContractAddress} from 'services/contracts';

const ContractButton = () => {
    const context = useWeb3React();
    const {chainId} = context;

    const openContractUrl = useCallback(() => {
        if (!chainId) return;
        const address = getContractAddress(ContractName.STAKING_TOKEN, chainId);
        const url = addressLink(chainId, address);
        safeWindowOpen(url);
    }, [chainId]);

    return (
        <WalletHeaderActionButton
            text="ZKP Contract"
            onClick={openContractUrl}
            logo={{src: etherscanIcon, alt: 'Etherscan logo'}}
            dataTestId="contract-button_action-button"
        />
    );
};

export default ContractButton;
