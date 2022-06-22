import React from 'react';

import {Container, Typography} from '@mui/material';
import {Link} from 'react-router-dom';

import {MainPageWrapper} from '../../components/MainPageWrapper';
import background from '../../images/background.png';

import './styles.scss';

const NotFoundPage = () => {
    return (
        <MainPageWrapper background={background}>
            <Container className="main-container">
                <Typography color="white" fontSize={34}>
                    Page Not Found
                </Typography>
                <Typography color="white" fontSize={24} marginBottom={5}>
                    Oops! Sorry, it looks like this Panther got a bit lost.
                </Typography>
                <Typography className="nav-item">
                    <Link to="/">Return to the home page</Link>
                </Typography>
            </Container>
        </MainPageWrapper>
    );
};

export default NotFoundPage;
