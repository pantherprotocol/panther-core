// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useEffect} from 'react';

import {Box, Container} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {MainPageWrapper} from 'components/MainPageWrapper';
import MessageAlert from 'components/MessageAlert';
import PrivateBalance from 'components/ZAssets/PrivateBalance';
import PrivateZAssetsTable from 'components/ZAssets/PrivateZAssetsTable';
import WrongZAssetsNetwork from 'components/ZAssets/WrongZassetsNetwork';
import {useAppDispatch} from 'redux/hooks';
import {getAdvancedStakesRewards} from 'redux/slices/wallet/advanced-stakes-rewards';
import {getPoolV0ExitTime} from 'redux/slices/wallet/poolV0';
import {chainHasPoolContract} from 'services/contracts';

import './styles.scss';

export default function ZAssets(): React.ReactElement {
    const context = useWeb3React();
    const {active, chainId} = context;

    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(getAdvancedStakesRewards, {context});
        if (!chainId || !chainHasPoolContract(chainId)) return;
        dispatch(getPoolV0ExitTime, context);
    }, [context, dispatch, chainId]);

    return (
        <MainPageWrapper>
            <Box className="assets-holder">
                <Container className="assets-container">
                    {active && chainId && !chainHasPoolContract(chainId) && (
                        <WrongZAssetsNetwork />
                    )}
                    {chainId && chainHasPoolContract(chainId) && (
                        <MessageAlert
                            title="Enhance Panther's privacy and earn rewards"
                            body="Deposit assets to improve Panther's anonymity set and
                        earn rewards for securing the protocol"
                            notificationOwner="zAssetsPage"
                        />
                    )}
                    <PrivateBalance />
                    <PrivateZAssetsTable />
                </Container>
            </Box>
        </MainPageWrapper>
    );
}
