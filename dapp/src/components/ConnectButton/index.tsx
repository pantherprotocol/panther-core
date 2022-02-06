import React from 'react';

import {Button} from '@mui/material';

import './styles.scss';

export const ConnectButton = (props: {text: string | null; onClick: any}) => {
    return (
        <div className="wallet-btn-holder">
            <Button
                className="wallet-btn"
                href="#"
                onClick={() => {
                    props.onClick();
                }}
            >
                {props?.text || 'Connect Wallet'}
            </Button>
        </div>
    );
};
