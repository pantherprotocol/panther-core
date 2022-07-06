import React from 'react';

import Button from '@mui/material/Button';

import './styles.scss';

export const WalletHeaderActionButton = (props: {
    text: string;
    onClick?: any;
    logo?: {src: string; alt: string};
}) => {
    return (
        <div className="wallet-header-action-button-holder">
            <Button
                className="wallet-header-action-button"
                onClick={props.onClick}
            >
                {props.logo && (
                    <img src={props.logo.src} alt={props.logo.alt} />
                )}

                <span>{props.text}</span>
            </Button>
        </div>
    );
};
