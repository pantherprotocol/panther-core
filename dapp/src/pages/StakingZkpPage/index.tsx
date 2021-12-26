import React from 'react';
import { Container } from '@mui/material';
import Grid from '@mui/material/Grid';
import './styles.scss';
import BalanceCard from '../../components/Cards/BalanceCard';
import StakingCard from '../../components/Cards/StakingCard';

function StakingZkpPage() {
    return (
        <>

            <Container maxWidth="lg">
                <Grid container>
                    <Grid item md={1} xs={12}></Grid>
                    <Grid
                        item
                        container
                        spacing={2}
                        md={10}
                        xs={12}

                    >
                        <Grid
                            item
                            xs={12}
                            md={5}
                            display={'flex'}
                            justifyContent={'center'}
                            alignItems={'start'}
                        >
                            <BalanceCard />
                        </Grid>
                        <Grid
                            item
                            xs={12}
                            md={7}
                            display={'flex'}
                            justifyContent={'center'}
                            alignItems={'center'}
                        >
                            <StakingCard />
                        </Grid>
                    </Grid>
                    <Grid item md={1} xs={12}></Grid>
                </Grid>
            </Container>
        </>
    );
}

export default StakingZkpPage;
