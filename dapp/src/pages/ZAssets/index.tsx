import React, {useEffect} from 'react';

import {useWeb3React} from '@web3-react/core';

import {MainPageWrapper} from '../../components/MainPageWrapper';
import PrivateBalance from '../../components/ZAssets/PrivateBalance';
import PrivateZAssetsTable from '../../components/ZAssets/PrivateZAssetsTable';
import background from '../../images/background.png';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {
    getAdvancedStakesRewards,
    hasUndefinedUTXOsSelector,
    refreshUTXOsStatuses,
} from '../../redux/slices/advancedStakesRewards';

import './styles.scss';

export default function ZAssets(): React.ReactElement {
    const context = useWeb3React();
    const {account} = context;
    const dispatch = useAppDispatch();
    const hasUndefinedUTXOs = useAppSelector(
        hasUndefinedUTXOsSelector(account),
    );

    useEffect(() => {
        dispatch(getAdvancedStakesRewards, context);
    }, [context, dispatch]);

    useEffect(() => {
        if (hasUndefinedUTXOs) {
            dispatch(refreshUTXOsStatuses, context);
        }
        // Empty dependency array as it needs to be run only once on the load
        // eslint-disable-next-line
    }, []);

    return (
        <MainPageWrapper {...{background}}>
            <div className="assets-holder">
                <div className="assets-container">
                    <PrivateBalance />
                    <PrivateZAssetsTable />
                </div>
            </div>
        </MainPageWrapper>
    );
}
