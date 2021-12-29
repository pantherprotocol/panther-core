import React, {useEffect, useState} from 'react';
import logo from '../../images/panther-logo-pre-zkp.svg';
import './styles.scss';
import {LogoutButton} from '../LogoutButton';
import {useWeb3React, UnsupportedChainIdError} from '@web3-react/core';
import {NoEthereumProviderError} from '@web3-react/injected-connector';
import {ConnectButton} from '../ConnectButton';
import {NavigationBtn} from '../NavigationButton';
import {onWrongNetwork, requiredNetwork} from '../../services/connectors';
import {
    formatAccountAddress,
    formatAccountBalance,
} from '../../services/account';

const StakingHeader = props => {
    const context = useWeb3React();
    const {account, library, chainId, active, error} = context;
    const [balance, setBalance] = useState(null);
    const [wrongNetwork, setWrongNetwork] = useState(false);

    const isNoEthereumProviderError = error instanceof NoEthereumProviderError;

    useEffect((): any => {
        const wrongNetwork =
            onWrongNetwork(context) || error instanceof UnsupportedChainIdError;
        setWrongNetwork(wrongNetwork);
        console.debug(
            'header: wrongNetwork',
            wrongNetwork,
            '/ active',
            active,
            '/ error',
            error,
        );
        if (wrongNetwork) {
            return;
        }

        if (account && library) {
            let stale = false;

            library
                .getBalance(account)
                .then((balance: any) => {
                    if (!stale) {
                        setBalance(balance);
                        setWrongNetwork(onWrongNetwork(context));
                    }
                })
                .catch(() => {
                    if (!stale) {
                        setBalance(null);
                    }
                });

            return () => {
                stale = true;
                setBalance(null);
            };
        }
    }, [context, active, account, library, chainId, error]); // ensures refresh if referential identity of library doesn't change across chainIds

    const accountAddress = formatAccountAddress(account) || '-';
    const accountBalance =
        formatAccountBalance(balance, requiredNetwork.symbol) || 'Error';

    const buttonActiveClass = active ? 'active' : '';

    return (
        <div className="staking-header">
            <div className="staking-main-header">
                <div className="logo-holder">
                    <a href="https://pantherprotocol.io">
                        <img src={logo} alt="Logo" className="logo" />
                    </a>
                </div>
                <div className={`header-right ${buttonActiveClass}`}>
                    {/* account details */}
                    {active && !wrongNetwork && (
                        <div className="address-btn">
                            <NavigationBtn
                                balance={accountBalance}
                                address={accountAddress}
                            />
                        </div>
                    )}

                    {/* connection button */}
                    {!active && !wrongNetwork && (
                        <div className="address-btn">
                            <ConnectButton
                                text={
                                    isNoEthereumProviderError
                                        ? 'Install MetaMask'
                                        : 'Connect Wallet'
                                }
                                onClick={() => {
                                    if (isNoEthereumProviderError) {
                                        window.open('https://metamask.io');
                                    } else {
                                        props.onConnect();
                                    }
                                }}
                            />
                        </div>
                    )}
                    {wrongNetwork && (
                        <div className="address-btn">
                            <ConnectButton
                                text={'Switch network'}
                                onClick={() => {
                                    props.switchNetwork();
                                }}
                            />
                        </div>
                    )}

                    {/* disconnection button */}
                    {active && !wrongNetwork && (
                        <div
                            className="header-settings"
                            onClick={() => {
                                props.disconnect();
                            }}
                            title="Disconnect wallet"
                        >
                            <LogoutButton />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StakingHeader;
