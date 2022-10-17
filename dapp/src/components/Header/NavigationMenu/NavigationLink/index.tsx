import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {Link, useHistory} from 'react-router-dom';

import {SafeLink} from '../../../Common/links';

import {NavigationLinkProps} from './NavigationLink.interface';

export default function NavigationLink(
    props: NavigationLinkProps,
): React.ReactElement {
    const {children, to} = props;
    const history = useHistory();
    const {location} = history;
    const {pathname} = location;

    if (!to.startsWith('/')) {
        // external link
        return (
            <Box className="nav-item">
                <Typography>
                    <SafeLink href={to}>{children}</SafeLink>
                </Typography>
            </Box>
        );
    }

    return (
        <Box className={`nav-item ${pathname === to ? 'selected' : ''}`}>
            <Link to={to}>{children}</Link>
        </Box>
    );
}
