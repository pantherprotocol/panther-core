import React from 'react';

import {Button} from '@mui/material';

import {PrimaryActionButtonProps} from './PrimaryActionButton.interface';

import './styles.scss';

const PrimaryActionButton = (props: PrimaryActionButtonProps) => {
    return (
        <div
            className="primary-action-button-holder"
            data-testid="common_primary-action-button_container"
        >
            <Button
                data-testid="common_primary-action-button_button"
                disabled={props.disabled ?? false}
                className={`primary-action-button ${props.styles ?? ''}`}
                onClick={props.onClick ?? null}
            >
                {props.children}
            </Button>
        </div>
    );
};
export default PrimaryActionButton;
