import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {SafeLink} from 'components/Common/links';
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
        <Box className={`nav-item ${pathname === to ? 'selected' : ''}`}>
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
