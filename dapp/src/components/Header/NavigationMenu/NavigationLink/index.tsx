// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {classnames} from 'components/common/classnames';
import {SafeLink} from 'components/common/links';
import {Link, useHistory} from 'react-router-dom';

import {NavigationLinkProps} from './NavigationLink.interface';

export default function NavigationLink(
    props: NavigationLinkProps,
): React.ReactElement {
    const {children, to} = props;
    const history = useHistory();
    const {location} = history;
    const {pathname} = location;

    return (
        <Box className={classnames('nav-item', {selected: pathname === to})}>
            {!to.startsWith('/') ? (
                <Typography>
                    <SafeLink href={to}>{children}</SafeLink>
                </Typography>
            ) : (
                <Link to={to}>{children}</Link>
            )}
        </Box>
    );
}
