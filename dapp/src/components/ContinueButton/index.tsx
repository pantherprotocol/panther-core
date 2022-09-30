import React from 'react';

import PrimaryActionButton from '../Common/PrimaryActionButton';

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
