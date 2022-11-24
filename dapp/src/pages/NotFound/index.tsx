// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {Container, Typography} from '@mui/material';
import {MainPageWrapper} from 'components/MainPageWrapper';
import {Link} from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <MainPageWrapper>
            <Container>
                <Typography color="white" fontSize={34}>
                    Page Not Found
                </Typography>
                <Typography color="white" fontSize={24} marginBottom={5}>
                    Oops! Sorry, it looks like this Panther got a bit lost.
                </Typography>
                <Typography>
                    <Link to="/">Return to the home page</Link>
                </Typography>
            </Container>
        </MainPageWrapper>
    );
};

export default NotFoundPage;
