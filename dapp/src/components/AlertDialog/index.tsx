import * as React from 'react';
import {ReactElement} from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import warningIcon from '../../images/warning-icon.svg';
import xIcon from '../../images/x-icon.svg';
import {useAppDispatch} from '../../redux/hooks';
import {setBlur} from '../../redux/slices/blur';
import {SafeLink} from '../Common/links';

import './styles.scss';

export default function AlertDialog(props: {
    handleClose: any;
    stake: any;
}): ReactElement {
    const dispatch = useAppDispatch();
    dispatch(setBlur());

    return (
        <div>
            <Dialog
                open={true}
                onClose={props.handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogContent className="alert-dialog-container">
                    <Box className="x-icon">
                        <Tooltip
                            title={'Click to close Dialog box'}
                            placement="top"
                        >
                            <IconButton onClick={props.handleClose}>
                                <img src={xIcon} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Box className="warning-header">
                        <IconButton onClick={props.handleClose}>
                            <img src={warningIcon} />
                        </IconButton>
                        <Typography component="div" className="warning-text">
                            Warning!
                        </Typography>
                    </Box>
                    <Box>
                        <Typography>
                            Staking is currently undergoing the switchover
                            described in{' '}
                            <SafeLink href="https://docs.pantherprotocol.io/dao/governance/proposal-4-polygon-fix">
                                DAO proposal #4.
                            </SafeLink>
                        </Typography>
                        <Typography className=" message">
                            If you stake now, your stake will not start accruing
                            rewards until the switchover is complete.
                        </Typography>
                        <Typography>
                            Are you sure you want to continue?
                        </Typography>
                    </Box>
                    <Box className="buttons-holder">
                        <Stack spacing={2} direction="row">
                            <Button
                                variant="outlined"
                                className="button cancel-button"
                                onClick={props.handleClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                className="button confirm-button"
                                onClick={props.stake}
                            >
                                Stake anyway
                            </Button>
                        </Stack>
                    </Box>
                </DialogContent>
            </Dialog>
        </div>
    );
}
