import React from 'react';

import Button from '@mui/material/Button';

import './styles.scss';

export const LogoutButton = (props: {disconnect: () => void}) => {
    const logoutButtonClick = () => {
        props.disconnect();
    };

    return (
        <div className="logout-button-holder">
            <Button
                className="logout-button"
                onClick={() => {
                    logoutButtonClick();
                }}
            >
                Logout
            </Button>
        </div>
    );
};
