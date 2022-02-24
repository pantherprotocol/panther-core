import React, {useCallback} from 'react';

import Button from '@mui/material/Button';
import {useWeb3React} from '@web3-react/core';

import etherscanIcon from '../../images/etherscan-icon.svg';
import {ContractName, getContractAddress} from '../../services/contracts';
import {addressLink, safeWindowOpen} from '../Common/links';

import './styles.scss';

export const ContractButton = () => {
    const context = useWeb3React();
    const {chainId} = context;

    const openContractUrl = useCallback(() => {
        if (!chainId) return;
        const address = getContractAddress(ContractName.STAKING_TOKEN, chainId);
        const url = addressLink(chainId, address);
        safeWindowOpen(url);
    }, [chainId]);

    return (
        <div className="contract-button-holder">
            <Button
                variant="contained"
                className="contract-button"
                onClick={openContractUrl}
            >
                <img src={etherscanIcon} alt={'Etherscan logo'} />
                <span>ZKP Contract</span>
            </Button>
        </div>
    );
};
