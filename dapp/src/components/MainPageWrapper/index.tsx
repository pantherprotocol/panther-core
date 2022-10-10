import React, {useEffect, useState} from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import {Box} from '@mui/system';

import background from '../../images/background-v0.5.png';
import {useAppSelector} from '../../redux/hooks';
import {blurSelector} from '../../redux/slices/blur';
import {isBlockedCountry} from '../../services/geo-location';
import BlockedUser from '../BlockedUser';
import Footer from '../Footer';
import Header from '../Header';

import './styles.scss';

export const MainPageWrapper = (props: {
    children: React.ReactNode;
}): React.ReactElement => {
    const isBlur = useAppSelector(blurSelector);
    const [blockedUser, setBlockedUser] = useState<boolean>(false);

    useEffect(() => {
        async function checkIfBlockedUser() {
            const response = await isBlockedCountry();
            if (response instanceof Error) {
                console.error(`Failed to fetch geoLocataion data: ${response}`);
            } else {
                setBlockedUser(response);
            }
        }
        checkIfBlockedUser();
    }, []);

    return (
        <Box
            data-testid="main-page-wrapper_main-page-wrapper_container"
            className={`main-page ${isBlur && 'isBlur'}`}
            sx={{
                backgroundImage: `url(${background})`,
            }}
        >
            <CssBaseline />
            {blockedUser ? (
                <BlockedUser />
            ) : (
                <Box data-testid="main-page-wrapper_main-page-wrapper_child">
                    <Box className="header-container">
                        <Header />
                    </Box>
                    <Box className="body-container">{props.children}</Box>
                    <Box className="footer-container">
                        <Footer />
                    </Box>
                </Box>
            )}
        </Box>
    );
};
