import React, {useCallback} from 'react';

import {Web3Provider} from '@ethersproject/providers';
import Button from '@mui/material/Button';
import {useWeb3React} from '@web3-react/core';

import logo from '../../images/panther-logo.svg';
import {STAKING_TOKEN_CONTRACT} from '../../services/contracts';
import {openNotification} from '../../services/notification';
import * as stakingService from '../../services/staking';
import {DECIMALS} from '../../utils';

import './styles.scss';

export const AddTokenButton = (props: {
    setTokenAdded: (b: boolean) => void;
}) => {
    const context = useWeb3React<Web3Provider>();
    const {library} = context;

    const addZKPToken = useCallback(async () => {
        const {ethereum} = window as any;

        const tokenAddress = STAKING_TOKEN_CONTRACT;
        const tokenContract = await stakingService.getStakingTokenContract(
            library,
        );
        if (!tokenContract) {
            return;
        }
        const tokenSymbol = await tokenContract.symbol();

        try {
            await ethereum
                .request({
                    method: 'wallet_watchAsset',
                    params: {
                        type: 'ERC20',
                        options: {
                            address: tokenAddress,
                            symbol: tokenSymbol,
                            decimals: DECIMALS,
                            image: logo,
                        },
                    },
                })
                .then(() => {
                    props.setTokenAdded(true);
                    localStorage.setItem('ZKP-Staking:tokenAdded', 'yes');
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
    }, [library, props]);

    return (
        <div className="add-token-button-holder">
            <Button
                variant="contained"
                className="add-token-button"
                onClick={addZKPToken}
            >
                Add ZKP token
            </Button>
        </div>
    );
};
