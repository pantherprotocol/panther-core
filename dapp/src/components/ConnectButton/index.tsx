import React from 'react';
import './styles.scss';

export const ConnectButton = (props: {text: string | null; onClick: any}) => {
    return (
        <div className="wallet-btn-holder">
            <a
                className="wallet-btn"
                href="#"
                onClick={() => {
                    props.onClick();
                }}
            >
                {props?.text || 'Connect Wallet'}
            </a>
        </div>
    );
};
