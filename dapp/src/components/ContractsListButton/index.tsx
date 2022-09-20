import React from 'react';

import {Link} from 'react-router-dom';

import {WalletHeaderActionButton} from '../Common/WalletHeaderActionButton';

export const ContractsListButton = () => {
    return (
        <Link to="/contracts" data-testid="contract-list-button_wrapper">
            <WalletHeaderActionButton text="Contracts List" />
        </Link>
    );
};
