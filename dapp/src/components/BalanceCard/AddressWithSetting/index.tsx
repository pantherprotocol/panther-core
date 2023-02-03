// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useState} from 'react';

import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import {Box, Tooltip} from '@mui/material';
import Address from 'components/Address';
import {classnames} from 'components/common/classnames';
import copyIcon from 'images/copy-icon.svg';
import CopyToClipboard from 'react-copy-to-clipboard';

import './styles.scss';

export default function AddressWithSetting(props: {account: string}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    return (
        <Box className="address-with-setting">
            <Box className="address">
                <Address />
            </Box>
            <Tooltip
                title={`${copied ? 'Copied!' : 'Copy Wallet Address'}`}
                placement="top"
            >
                <span
                    className={classnames('copy-icon-wrapper', {
                        copied,
                    })}
                >
                    <CopyToClipboard text={props.account} onCopy={handleCopy}>
                        {copied ? (
                            <CheckOutlinedIcon />
                        ) : (
                            <img src={copyIcon} alt="copy-icon" />
                        )}
                    </CopyToClipboard>
                </span>
            </Tooltip>
        </Box>
    );
}
