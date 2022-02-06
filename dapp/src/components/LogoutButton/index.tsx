import React from 'react';

import Button from '@mui/material/Button';
import {useHistory} from 'react-router-dom';

import './styles.scss';

export const LogoutButton = () => {
    const history = useHistory();

    const navigateButtonClick = () => {
        history.push({
            pathname: '/',
        });
    };

    return (
        <div className="logout-button-holder">
            <Button
                className="logout-button"
                onClick={() => {
                    navigateButtonClick();
                }}
            >
                Logout
            </Button>
        </div>
    );
};
