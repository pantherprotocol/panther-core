import * as React from 'react';
import {useCallback, useState} from 'react';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    Button,
    Box,
    Checkbox,
} from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import {useWeb3React} from '@web3-react/core';

import backButtonLeftArrow from '../../../../../../../images/back-button-left-arrow.svg';
import rightSideArrow from '../../../../../../../images/right-arrow-icon.svg';
import {formatTime} from '../../../../../../../lib/format';
import {useAppDispatch, useAppSelector} from '../../../../../../../redux/hooks';
import {updateUTXOStatus} from '../../../../../../../redux/slices/advancedStakesRewards';
import {removeBlur, setBlur} from '../../../../../../../redux/slices/blur';
import {termsSelector} from '../../../../../../../redux/slices/stakeTerms';
import {exit} from '../../../../../../../services/pool';
import {
    AdvancedStakeRewards,
    StakeType,
} from '../../../../../../../types/staking';

import './styles.scss';

export default function RedeemRewards(props: {rewards: AdvancedStakeRewards}) {
    const context = useWeb3React();
    const {library, account, chainId} = context;
    const dispatch = useAppDispatch();

    const lockedTill = useAppSelector(
        termsSelector(chainId!, StakeType.Advanced, 'lockedTill'),
    );

    const [open, setOpen] = useState(false);
    const [redeemConfirmed, setRedeemConfirmed] = useState(false);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRedeemConfirmed(event.target.checked);
    };

    const handleClickOpen = () => {
        setRedeemConfirmed(false);
        setOpen(true);
        dispatch(setBlur);
    };

    const handleClose = useCallback(() => {
        setOpen(false);
        dispatch(removeBlur);
    }, [dispatch]);

    const redeem = useCallback(async () => {
        handleClose();
        const utxoStatus = await exit(
            library,
            account as string,
            chainId as number,
            props.rewards.utxoData,
            BigInt(props.rewards.id),
            Number(props.rewards.creationTime),
            props.rewards.commitments,
        );
        dispatch(updateUTXOStatus, [account, props.rewards.id, utxoStatus]);
    }, [dispatch, library, account, chainId, props.rewards, handleClose]);

    const isRedemptionPossible =
        lockedTill && Number(lockedTill) * 1000 < Date.now();

    return (
        <Box>
            {' '}
            <Button
                variant="contained"
                className="redeem-button"
                endIcon={
                    isRedemptionPossible ? <img src={rightSideArrow} /> : null
                }
                disabled={!isRedemptionPossible}
                onClick={() => handleClickOpen()}
            >
                {isRedemptionPossible ? (
                    'Redeem zZKP'
                ) : (
                    <Box>
                        <Typography>Locked Until:</Typography>
                        <Typography>
                            {formatTime(Number(lockedTill) * 1000, {
                                style: 'short',
                            })}
                        </Typography>
                    </Box>
                )}
            </Button>
            <Dialog className="redeem-box" onClose={handleClose} open={open}>
                <DialogTitle className="redeem-dialog-header">
                    <IconButton className="back-button" onClick={handleClose}>
                        <img src={backButtonLeftArrow} />
                        <Typography id="caption">Back</Typography>
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    <Typography id="redeem-dialog-title">
                        Early ZKP Redemption
                    </Typography>
                    <Typography
                        component="div"
                        className="dialog-message"
                        display="inline"
                    >
                        <Box id="dialog-warning" display="inline">
                            Warning!
                        </Box>
                        <Box display="inline">
                            If you redeem ZKP before v1.0 of the Multi-Asset
                            Shielded Pool has launched, you will only receive
                            ZKP in return for your zZKP,{' '}
                        </Box>
                        <Box className="bold" display="inline">
                            and your PRP rewards will be lost forever.
                        </Box>
                    </Typography>
                    <FormGroup>
                        <FormControlLabel
                            className="confirm-redemption-checkbox"
                            control={
                                <Checkbox
                                    checked={redeemConfirmed}
                                    onChange={handleChange}
                                />
                            }
                            label="I understand I will lose all PRP rewards"
                        />
                    </FormGroup>
                </DialogContent>

                <DialogActions
                    className={`redeem-action ${
                        redeemConfirmed ? 'active' : ''
                    }`}
                >
                    <Button
                        autoFocus
                        onClick={redeem}
                        disabled={!redeemConfirmed}
                    >
                        Redeem zZKP and burn PRP rewards
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
