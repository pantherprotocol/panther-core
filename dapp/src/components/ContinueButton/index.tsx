// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import PrimaryActionButton from 'components/common/PrimaryActionButton';

const ContinueButton = (props: {onClick: any}) => {
    return (
        <PrimaryActionButton
            onClick={props.onClick}
            data-testid="continue-button_continue-button_wrapper"
        >
            <span>Continue</span>
        </PrimaryActionButton>
    );
};

export default ContinueButton;
