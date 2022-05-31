import React from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import {Box} from '@mui/system';

import {useAppSelector} from '../../redux/hooks';
import {blurSelector} from '../../redux/slices/blur';
import {Footer} from '../Footer';
import Header from '../Header';

import './styles.scss';

export const MainPageWrapper = (props: {
    background: string;
    children: React.ReactNode;
}): React.ReactElement => {
    const isBlur = useAppSelector(blurSelector);
    return (
        <Box
            className={`main-page ${isBlur && 'isBlur'}`}
            sx={{
                backgroundImage: `url(${props.background})`,
            }}
        >
            <CssBaseline />
            <Box className="header-container">
                <Header />
            </Box>
            <Box className="body-container">{props.children}</Box>
            <Box className="footer-container">
                <Footer />
            </Box>
        </Box>
    );
};
