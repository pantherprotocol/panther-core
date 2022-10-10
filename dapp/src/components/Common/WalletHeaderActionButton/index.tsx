import React from 'react';

import Button from '@mui/material/Button';

import './styles.scss';

export const WalletHeaderActionButton = (props: {
    text: string;
    onClick?: any;
    logo?: {src: string; alt: string};
    dataTestId?: string;
}) => {
    return (
        <Button
            className="wallet-header-action-button"
            onClick={props.onClick}
            data-testid={props.dataTestId}
        >
            <span>{props.text}</span>
        </Button>
    );
};
