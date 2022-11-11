import React from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {Box, Tooltip, Typography} from '@mui/material';
// eslint-disable-next-line import/named
import {Meta, Story} from '@storybook/react';
import {formatAccountAddress} from 'lib/format';
import CopyToClipboard from 'react-copy-to-clipboard';
import Jazzicon, {jsNumberForAddress} from 'react-jazzicon';
import {Provider} from 'react-redux';
import {store} from 'redux/store';

import {AddressWithSettingProps} from './AddressWithSetting.interface';

import AddressWithSetting from './index';

export default {
    title: 'AddressWithSetting',
    component: AddressWithSetting,
} as Meta;

const dummyAddress = '0x2f24A3786Aa4fCdF968373019D004Ba49255B20a';

const Template: Story<AddressWithSettingProps> = () => (
    <Provider store={store}>
        <Box className="address-with-setting">
            <Box className="address">
                <Box
                    className="address-container"
                    data-testid="address-component"
                >
                    <Box className="user-avatar">
                        <Jazzicon
                            diameter={30}
                            seed={jsNumberForAddress(dummyAddress)}
                        />
                    </Box>
                    <Typography className="account-address">
                        {formatAccountAddress(dummyAddress)}
                    </Typography>
                </Box>
            </Box>
            <Tooltip title="Copy Wallet Address" placement="top">
                <span>
                    <CopyToClipboard text={dummyAddress}>
                        <ContentCopyIcon className="content-copy-icon" />
                    </CopyToClipboard>
                </span>
            </Tooltip>
        </Box>
    </Provider>
);

export const Default = Template.bind({});
