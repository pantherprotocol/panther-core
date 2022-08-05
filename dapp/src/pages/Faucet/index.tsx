import React from 'react';

import {Container} from '@mui/material';
import Grid from '@mui/material/Grid';

import {MainPageWrapper} from '../../components/MainPageWrapper';
import ZafariFaucet from '../../components/ZafariFaucet';
import ZafariLogo from '../../components/ZafariLogo';

import './styles.scss';

const Faucet = () => {
    return (
        <MainPageWrapper>
            <Container className="faucet-container">
                <Grid container>
                    <Grid item xs={12} md={4}></Grid>

                    <Grid
                        container
                        justifyContent="center"
                        alignItems="center"
                        item
                        md={4}
                        xs={12}
                    >
                        <Grid item xs={12} sm={12} md={12}>
                            <ZafariLogo />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <ZafariFaucet />
                        </Grid>
                    </Grid>
                    <Grid item xs={12} md={4}></Grid>
                </Grid>
            </Container>
        </MainPageWrapper>
    );
};

export default Faucet;
