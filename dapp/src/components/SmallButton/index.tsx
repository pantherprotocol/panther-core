import React from 'react';

import {Button} from '@mui/material';

import './styles.scss';

export const SmallButton = (props: {text: string; onClick: () => void}) => {
    return (
        <div className="small-btn-holder" data-testid="small-button_holder">
            <Button
                className="small-btn"
                href="#"
                onClick={() => {
                    props.onClick();
                }}
            >
                {props.text}
            </Button>
        </div>
    );
};
