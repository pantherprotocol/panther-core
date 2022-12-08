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
import UserTerms from 'components/ScrollableDialog';
import warningIcon from 'images/warning-icon.svg';

import './styles.scss';

export default function BlockedUser(): ReactElement {
    const [showUserTermsDialog, setShowUserTermsDialog] = useState(false);
    const handleCloseWarningDialog = () => {
        setShowUserTermsDialog(false);
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
                        is not available in this area.
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
