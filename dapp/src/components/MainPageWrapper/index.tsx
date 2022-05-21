import React from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import {Box} from '@mui/system';

import {useAppSelector} from '../../redux/hooks';
import {blurSelector} from '../../redux/slices/blur';
import {Network} from '../../services/connectors';
import {switchNetwork} from '../../services/wallet';
import {Footer} from '../Footer';
import Header from '../Header';

import './styles.scss';

export const MainPageWrapper = (props: {
    onConnect: () => void;
    network: Network | null;
    background: string;
    children: React.ReactNode;
}): React.ReactElement => {
    const isBlur = useAppSelector(blurSelector);
    return (
        <Box
            className={`main-app main-page ${isBlur && 'isBlur'}`}
            sx={{
                backgroundImage: `url(${props.background})`,
            }}
        >
            <CssBaseline />
            <Header
                onConnect={() => {
                    props.onConnect();
                }}
                switchNetwork={(chainId: number) => {
                    switchNetwork(chainId);
                }}
                networkName={props.network?.name}
                networkSymbol={props.network?.symbol}
                networkLogo={props.network?.logo}
            />
            <Box className="main-box-holder">{props.children}</Box>
            <Footer />
        </Box>
    );
};
