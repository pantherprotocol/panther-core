import * as React from 'react';
import {ChangeEvent, useEffect, useState} from 'react';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    Checkbox,
} from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';

import {useAppDispatch} from '../../../../redux/hooks';
import {removeBlur, setBlur} from '../../../../redux/slices/blur';
import BackButton from '../../../BackButton';
import PrimaryActionButton from '../../../Common/PrimaryActionButton';

import './styles.scss';

export default function RedeemRewardsWarningDialog(props: {
    handleClose: () => void;
    handleRedeemButtonClick: () => void;
}) {
    const dispatch = useAppDispatch();
    const [redemptionConfirmed, setRedeemConfirmed] = useState(false);

    const toggleConfirmationCheckbox = (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        setRedeemConfirmed(event.target.checked);
    };

    useEffect((): (() => any) => {
        dispatch(setBlur);
        return () => dispatch(removeBlur);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Dialog
            className="modal-dialog redeem-dialog"
            onClose={props.handleClose}
            open={true}
        >
            <BackButton onClick={props.handleClose} />
            <DialogTitle>
                <Typography className="modal-dialog-title">
                    Early ZKP Redemption
                </Typography>
            </DialogTitle>

            <DialogContent className="modal-dialog-content-holder">
                <Box
                    component="div"
                    className="modal-dialog-content"
                    display="inline"
                >
                    <Box display="inline" className="content-body">
                        As an Advanced Staking user, you're qualified to
                        receive:
                        <ol>
                            <li>
                                Staking rewards (zZKP in the MASP)
                                <br />
                                that accumulate PRPs - accrued PRPs.
                            </li>
                            <li>
                                10k Panther Reward Points
                                <br />
                                that will become redeemable for zZKP upon
                                launch.
                            </li>
                        </ol>
                        <Box>
                            <Typography className="warning" display="inline">
                                WARNING!
                            </Typography>{' '}
                            By redeeming before our v1 launch, you will still be
                            able to claim 10k PRPs after the launch but{' '}
                            <strong>
                                will lose all additional accrued rewards
                            </strong>{' '}
                            (see point 1).
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <Box>
                <FormGroup className="confirm-redemption-checkbox">
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={redemptionConfirmed}
                                onChange={toggleConfirmationCheckbox}
                            />
                        }
                        label={
                            <Typography>
                                I understand I will lose additional{' '}
                                <strong> accrued </strong> PRP rewards
                            </Typography>
                        }
                    />
                </FormGroup>
            </Box>

            <DialogActions>
                <Box className={`redeem-action-holder`}>
                    <PrimaryActionButton
                        onClick={props.handleRedeemButtonClick}
                        styles={`custom-style ${
                            !redemptionConfirmed ? 'notActive' : ''
                        }`}
                        disabled={!redemptionConfirmed}
                    >
                        <Typography>
                            Redeem zZKP and forfeit additional{' '}
                            <strong>accrued</strong> PRP rewards
                        </Typography>
                    </PrimaryActionButton>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
