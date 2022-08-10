import React, {useEffect} from 'react';

import {Box, Container} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import {MainPageWrapper} from '../../components/MainPageWrapper';
import PrivateBalance from '../../components/ZAssets/PrivateBalance';
import PrivateZAssetsTable from '../../components/ZAssets/PrivateZAssetsTable';
import WrongZAssetsNetwork from '../../components/ZAssets/WrongZassetsNetwork';
import background from '../../images/background.png';
import {useAppDispatch} from '../../redux/hooks';
import {getAdvancedStakesRewards} from '../../redux/slices/advancedStakesRewards';
import {getPoolV0ExitTime} from '../../redux/slices/poolV0';
import {chainHasPoolContract} from '../../services/contracts';
import {MASP_CHAIN_ID} from '../../services/env';

import './styles.scss';

export default function ZAssets(): React.ReactElement {
    const context = useWeb3React();
    const {active, chainId} = context;

    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(getAdvancedStakesRewards, context);
        if (chainId === MASP_CHAIN_ID) {
            dispatch(getPoolV0ExitTime, context);
        }
    }, [context, dispatch, chainId]);

    return (
        <MainPageWrapper background={background}>
            <Box className="assets-holder">
                <Container className="assets-container">
                    {active && chainId && !chainHasPoolContract(chainId) && (
                        <WrongZAssetsNetwork />
                    )}

                    <PrivateBalance />
                    <PrivateZAssetsTable />
                </Container>
            </Box>
        </MainPageWrapper>
    );
}
