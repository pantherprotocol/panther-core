import React from 'react';

import './styles.scss';

export const NavigationBtn = props => {
    return (
        <div className="select-navi-holder">
            <button className="select-navi">
                <div className="currency-navi-holder">
                    <img
                        className="currency-logo"
                        src={props.image}
                        alt="Crytocurrency Logo"
                    />
                    <div className="navi-btn-text-hold">
                        <p className="front-text"> {props.balance}</p>
                        <p className="main-text">{props.address}</p>
                    </div>
                </div>
            </button>
        </div>
    );
};
