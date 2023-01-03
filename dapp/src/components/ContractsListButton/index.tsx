// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {Routes} from 'constants/routes';

import {WalletHeaderActionButton} from 'components/common/WalletHeaderActionButton';
import {Link} from 'react-router-dom';

export const ContractsListButton = () => {
    return (
        <Link to={Routes.Contracts} data-testid="contract-list-button_wrapper">
            <WalletHeaderActionButton text="Contracts List" />
        </Link>
    );
};
