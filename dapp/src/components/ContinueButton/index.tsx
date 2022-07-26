import React from 'react';

import PrimaryActionButton from '../Common/PrimaryActionButton';

const ContinueButton = (props: {onClick: any}) => {
    return (
        <PrimaryActionButton onClick={props.onClick}>
            <span>Continue</span>
        </PrimaryActionButton>
    );
};

export default ContinueButton;
