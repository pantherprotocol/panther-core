// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {useEffect, useState} from 'react';

const SMALL_SCREEN_SIZE = 363;
const MOBILE_SCREEN_SIZE = 768;
const MEDIUM_SCREEN_SIZE = 867;
const NORMAL_SCREEN_SIZE = 1000;

interface Screen {
    isSmall: boolean;
    isMobile: boolean;
    isMedium: boolean;
    isNormal: boolean;
    screenSize: number;
}

export default function useScreenSize(): Screen {
    const [screenSize, setScreenSize] = useState(getWindowSize());

    function getWindowSize() {
        const {innerWidth} = window;
        return innerWidth;
    }

    useEffect(() => {
        function handleWindowResize() {
            setScreenSize(getWindowSize());
        }

        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
        };
    }, []);

    return {
        screenSize,
        isSmall: screenSize < SMALL_SCREEN_SIZE,
        isMobile: screenSize < MOBILE_SCREEN_SIZE,
        isMedium: screenSize < MEDIUM_SCREEN_SIZE,
        isNormal: screenSize < NORMAL_SCREEN_SIZE,
    };
}
