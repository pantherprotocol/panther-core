import React, {ReactElement} from 'react';

import {Button} from '@mui/material';

import './styles.scss';

const PrimaryActionButton = (props: {
    onClick?: any;
    styles?: string;
    disabled?: boolean;
    children: string | ReactElement;
}) => {
    return (
        <div className="primary-action-button-holder">
            <Button
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
