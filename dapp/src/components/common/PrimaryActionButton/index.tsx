// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {Button} from '@mui/material';

import {classnames} from '../classnames';

import {PrimaryActionButtonProps} from './PrimaryActionButton.interface';

import './styles.scss';

const PrimaryActionButton = (props: PrimaryActionButtonProps) => {
    return (
        <div
            className="primary-action-button-holder"
            data-testid="common_primary-action-button_container"
        >
            <Button
                disabled={props.disabled ?? false}
                className={classnames('primary-action-button', props.styles)}
                onClick={props.onClick ?? null}
                data-testid={props.dataTestid}
            >
                {props.children}
            </Button>
        </div>
    );
};
export default PrimaryActionButton;
