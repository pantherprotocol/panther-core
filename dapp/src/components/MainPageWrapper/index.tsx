// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useCallback, useEffect, useState} from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import {Box} from '@mui/system';
import BlockedUser from 'components/BlockedUser';
import Footer from 'components/Footer';
import Header from 'components/Header';
import {useAppSelector} from 'redux/hooks';
import {blurSelector} from 'redux/slices/ui/blur';
import {isStaging} from 'services/env';
import {isBlockedCountry} from 'services/geo-location';

import './styles.scss';

function genTestBackground(): string | null {
    const text = 'TEST';
    const canvas = document.createElement('canvas');
    const fontSize = 100;
    canvas.setAttribute('height', (fontSize * 3).toString());
    canvas.setAttribute('width', (fontSize * 5).toString());
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.textAlign = 'center';
    context.fillStyle = '#52525b';
    context.font = fontSize + 'px monospace';
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    context.fillText(text, centerX, centerY);
    return canvas.toDataURL('image/png');
}

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

    const testBackground = useCallback(genTestBackground, []);

    return (
        <Box
            data-testid="main-page-wrapper_main-page-wrapper_container"
            className={`main-page ${isBlur && 'isBlur'}`}
        >
            <Box
                className="inner-wrapper"
                sx={{
                    background: isStaging()
                        ? `url("${testBackground()}")`
                        : undefined,
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
        </Box>
    );
};
