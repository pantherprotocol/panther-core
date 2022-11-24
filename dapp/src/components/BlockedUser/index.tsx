// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';
import {ReactElement, useState} from 'react';

import {
    DialogTitle,
    DialogContent,
    Dialog,
    Box,
    Typography,
    IconButton,
} from '@mui/material';
import {SafeMuiLink} from 'components/Common/links';
import PrimaryActionButton from 'components/Common/PrimaryActionButton';
import UserTerms from 'components/ScrollableDialog';
import warningIcon from 'images/warning-icon.svg';
import {Link} from 'react-router-dom';

import './styles.scss';

export default function BlockedUser(): ReactElement {
    const [showUserTermsDialog, setShowUserTermsDialog] = useState(false);
    const handleCloseWarningDialog = () => {
        setShowUserTermsDialog(false);
    };

    const handleOpenWarningDialog = () => {
        setShowUserTermsDialog(true);
    };

    return showUserTermsDialog ? (
        <UserTerms
            handleClose={handleCloseWarningDialog}
            title="Terms of Service"
        />
    ) : (
        <Dialog className="modal-dialog" open={true}>
            <DialogTitle>
                <Typography className="modal-dialog-title">
                    <IconButton>
                        <img src={warningIcon} />
                    </IconButton>
                    Important Notice
                </Typography>
            </DialogTitle>

            <DialogContent>
                <Box className="blocked-user ">
                    <Box>
                        It appears that you are visiting from the prohibited
                        jurisdiction. Unfortunately, Panther's Advanced Staking
                        is not available in this area. You can read about this{' '}
                        <Link to="#" onClick={handleOpenWarningDialog}>
                            here
                        </Link>
                        .
                        <br />
                        <br />
                        If you would like to explore and test the Panther dApp,
                        you can continue to Panther's Testing Environment. To
                        learn more about the Panther Protocol, visit our{' '}
                        <SafeMuiLink
                            href="http://pantherprotocol.io/"
                            underline="always"
                        >
                            Website
                        </SafeMuiLink>{' '}
                    </Box>
                </Box>
            </DialogContent>

            <SafeMuiLink href="https://test.staking.pantherprotocol.io/">
                <PrimaryActionButton>
                    <Typography>
                        <strong>Continue</strong>
                    </Typography>
                </PrimaryActionButton>
            </SafeMuiLink>
        </Dialog>
    );
}
