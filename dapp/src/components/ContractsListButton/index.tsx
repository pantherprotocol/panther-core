import React from 'react';

import {Link} from 'react-router-dom';

import {WalletHeaderActionButton} from '../Common/WalletHeaderActionButton';

export const ContractsListButton = () => {
    return (
        <Link to="/contracts">
            <WalletHeaderActionButton text="Contracts List" />
        </Link>
    );
};
