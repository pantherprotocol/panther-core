// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {MainPageWrapper} from 'components/MainPageWrapper';
import ZafariFaucet from 'components/ZafariFaucet';

const Faucet = () => {
    return (
        <MainPageWrapper>
            <ZafariFaucet />
        </MainPageWrapper>
    );
};

export default Faucet;
