import React, {useEffect} from 'react';

import {Box, Container} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import {MainPageWrapper} from '../../components/MainPageWrapper';
import PrivateBalance from '../../components/ZAssets/PrivateBalance';
import PrivateZAssetsTable from '../../components/ZAssets/PrivateZAssetsTable';
import background from '../../images/background.png';
import {useAppDispatch} from '../../redux/hooks';
import {getAdvancedStakesRewards} from '../../redux/slices/advancedStakesRewards';

import './styles.scss';

export default function ZAssets(): React.ReactElement {
    const context = useWeb3React();
    const dispatch = useAppDispatch();
    useEffect(() => {
        dispatch(getAdvancedStakesRewards, context);
    }, [context, dispatch]);

    return (
        <MainPageWrapper background={background}>
            <Box className="assets-holder">
                <Container className="assets-container">
                    <PrivateBalance />
                    <PrivateZAssetsTable />
                </Container>
            </Box>
        </MainPageWrapper>
    );
}
