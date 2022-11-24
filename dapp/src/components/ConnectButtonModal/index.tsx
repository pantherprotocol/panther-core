// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import './styles.scss';

export const ConnectButtonModal = (props: {url?: string; name: string}) => {
    return (
        <div
            className="wallet-modal-btn-holder"
            data-testid="connect-button-modal_holder-button"
        >
            <a
                className="wallet-modal-btn"
                href={props?.url}
                data-testid="connect-button-modal_anchor-tag"
            >
                {props.name}
            </a>
        </div>
    );
};
