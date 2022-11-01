import React, {useEffect} from 'react';

import {Container} from '@mui/material';
import Grid from '@mui/material/Grid';
import {Box} from '@mui/system';
import {useWeb3React} from '@web3-react/core';

import AdvancedStakingRewards from '../../components/AdvancedStakingRewards';
import BalanceCard from '../../components/BalanceCard';
import {MainPageWrapper} from '../../components/MainPageWrapper';
import StakingUnstakingCard from '../../components/StakingUnstakingCard';
import Welcome from '../../components/Welcome';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {getStakeTerms} from '../../redux/slices/staking/stakeTerms';
import {getTotalsOfAdvancedStakes} from '../../redux/slices/staking/totalsOfAdvancedStakes';
import {getTotalUnclaimedClassicRewards} from '../../redux/slices/staking/totalUnclaimedClassicRewards';
import {getZkpStakedBalance} from '../../redux/slices/staking/zkpStakedBalance';
import {acknowledgedNotificationSelector} from '../../redux/slices/ui/acknowledgedNotifications';
import {getAdvancedStakesRewards} from '../../redux/slices/wallet/advancedStakesRewards';
import {getZkpTokenBalance} from '../../redux/slices/wallet/zkpTokenBalance';

import './styles.scss';

const Staking = (): React.ReactElement => {
    const context = useWeb3React();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(getTotalsOfAdvancedStakes, context);
        dispatch(getZkpTokenBalance, context);
        dispatch(getZkpStakedBalance, context);
        dispatch(getTotalUnclaimedClassicRewards, context);
        dispatch(getAdvancedStakesRewards, {context});
        dispatch(getStakeTerms, context);
    }, [context, dispatch]);

    const firstVisit = useAppSelector(
        acknowledgedNotificationSelector('notFirstVisit'),
    );

    return (
        <MainPageWrapper>
            {!firstVisit ? (
                <Welcome />
            ) : (
                <Container className="staking-container">
                    <Grid container>
                        <Grid item md={1} xs={12} />
                        <Grid item container spacing={2} md={10} xs={12}>
                            <Grid item xs={12} md={5}>
                                <Box width={'100%'}>
                                    <BalanceCard />
                                </Box>
                            </Grid>
                            <Grid
                                item
                                xs={12}
                                md={7}
                                className="apy-staking-right-panel"
                            >
                                <Box width={'100%'}>
                                    <AdvancedStakingRewards />
                                    <StakingUnstakingCard />
                                </Box>

                                <Grid item xs={12} md={3}></Grid>
                            </Grid>
                        </Grid>
                        <Grid item md={1} xs={12} />
                    </Grid>
                </Container>
            )}
        </MainPageWrapper>
    );
};

export default Staking;
