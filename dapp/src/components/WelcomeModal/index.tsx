import React from 'react';

import {ConnectButtonModal} from '../ConnectButtonModal';

import pantherLogo from './../../images/panther-logo.svg';

import './styles.scss';

export const WelcomeModal = () => {
    return (
        <div className="welcome-modal-holder">
            <div className="welcome-modal-container">
                <div className="welcome-modal">
                    <div className="graphic-placeholder">
                        <img src={pantherLogo} alt="Panther Logo" />
                    </div>
                    <h2>Welcome to the Panther MVP UI</h2>
                    <div className="welcome-text">
                        <p className="welcome-first">
                            Click anywhere on the screen to view available
                            buttons and actions.
                        </p>
                        <p className="welcome-second">
                            Please note: this demo is a work-in-progress.
                        </p>
                    </div>

                    <div className="welcome-step">
                        <ConnectButtonModal name="Start" url={'/onboarding'} />
                    </div>
                </div>
            </div>
        </div>
    );
};
