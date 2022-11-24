// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TermsOfService from 'components/TermsOfService';

import {ScrollableDialogProps} from './ScrollableDialog.interface';

export default function ScrollableDialog(props: ScrollableDialogProps) {
    return (
        <div className="terms-dialog">
            <Dialog
                open={true}
                onClose={props.handleClose}
                scroll="paper"
                aria-labelledby="scroll-dialog-title"
                aria-describedby="scroll-dialog-description"
                fullScreen={true}
                transitionDuration={1000}
            >
                <DialogTitle id="scroll-dialog-title">
                    {props.title}
                </DialogTitle>
                <DialogContent dividers={true}>
                    <div id="scroll-dialog-description" tabIndex={-1}>
                        <TermsOfService />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={props.handleClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
