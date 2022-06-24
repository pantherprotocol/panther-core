import * as React from 'react';
import {ReactElement, useCallback, useEffect, useState} from 'react';

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
import {useAppDispatch} from '../../../../../../../redux/hooks';
import {updateUTXOStatus} from '../../../../../../../redux/slices/advancedStakesRewards';
import {removeBlur, setBlur} from '../../../../../../../redux/slices/blur';
import {env} from '../../../../../../../services/env';
import {getExitTime, exit} from '../../../../../../../services/pool';
import {AdvancedStakeRewards} from '../../../../../../../types/staking';

import './styles.scss';

function getButtonContents(
    exitTime: number | undefined,
    afterExitTime: boolean,
    treeUri: string | undefined,
): string | ReactElement {
    if (afterExitTime) {
        return treeUri ? 'Redeem zZKP' : 'Redemption opens soon!';
    }
    return (
        <Box>
            <Typography>Locked Until:</Typography>
            <Typography>
                {exitTime
                    ? formatTime(Number(exitTime) * 1000, {
                          style: 'short',
                      })
                    : '?'}
            </Typography>
        </Box>
    );
}

export default function RedeemRewards(props: {rewards: AdvancedStakeRewards}) {
    const context = useWeb3React();
    const {library, account, chainId} = context;
    const dispatch = useAppDispatch();

    const [exitTime, setExitTime] = useState<number>();
    const [open, setOpen] = useState(false);
    const [redeemConfirmed, setRedeemConfirmed] = useState(false);

    const updateExitTime = useCallback(async () => {
        if (!chainId) return;
        const newExitTime = await getExitTime(library, chainId);
        setExitTime(newExitTime);
        console.debug(
            'early redemption allowed at',
            formatTime(Number(newExitTime) * 1000, {
                style: 'short',
            }),
            newExitTime,
        );
    }, [chainId, library]);

    useEffect(() => {
        updateExitTime();
    }, [updateExitTime]);

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

    const afterExitTime = exitTime
        ? Number(exitTime) * 1000 < Date.now()
        : false;
    const treeUri = env[`COMMITMENT_TREE_URL_${chainId}`];
    const isRedemptionPossible = treeUri && afterExitTime;

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
                {getButtonContents(exitTime, afterExitTime, treeUri)}
            </Button>
            <Dialog
                className="modal-dialog redeem-dialog"
                onClose={handleClose}
                open={open}
            >
                <Box className="modal-dialog-back-button-holder">
                    <IconButton className="back-button" onClick={handleClose}>
                        <img src={backButtonLeftArrow} />
                        <Typography id="caption">Back</Typography>
                    </IconButton>
                </Box>
                <DialogTitle>
                    <Typography className="modal-dialog-title">
                        Early ZKP Redemption
                    </Typography>
                </DialogTitle>

                <DialogContent className="modal-dialog-content-holder">
                    <Typography
                        component="div"
                        className="modal-dialog-content"
                        display="inline"
                    >
                        <Box className="warning" display="inline">
                            Warning!
                        </Box>
                        <Box display="inline">
                            If you redeem ZKP before v1.0 of the Multi-Asset
                            Shielded Pool has launched, you will only receive
                            ZKP in return for your zZKP,{' '}
                            <strong>
                                and your PRP rewards will be lost forever.
                            </strong>
                        </Box>
                    </Typography>
                </DialogContent>
                <Box>
                    <FormGroup className="confirm-redemption-checkbox">
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={redeemConfirmed}
                                    onChange={handleChange}
                                />
                            }
                            label="I understand I will lose all PRP rewards"
                        />
                    </FormGroup>
                </Box>
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
