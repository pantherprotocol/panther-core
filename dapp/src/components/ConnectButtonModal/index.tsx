import React from 'react';

import './styles.scss';

export const ConnectButtonModal = (props: {url?: string; name: string}) => {
    return (
        <div className="wallet-modal-btn-holder">
            <a className="wallet-modal-btn" href={props?.url}>
                {props.name}
            </a>
        </div>
    );
};
