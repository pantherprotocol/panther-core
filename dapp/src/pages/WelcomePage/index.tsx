import React from 'react';

import {WelcomeModal} from '../../components/WelcomeModal';

import './styles.scss';

const WelcomePage = () => {
    return (
        <div className="welcome-page">
            <WelcomeModal />
            <div>
                <p className="copyright">© 2022 Panther Ventures Limited</p>
            </div>
        </div>
    );
};

export default WelcomePage;
