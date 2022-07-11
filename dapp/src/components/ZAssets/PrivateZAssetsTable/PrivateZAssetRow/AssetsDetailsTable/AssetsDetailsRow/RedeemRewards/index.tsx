import * as React from 'react';
import {ReactElement, useCallback, useState} from 'react';

import {Typography, Button, Box} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import rightSideArrow from '../../../../../../../images/right-arrow-icon.svg';
import {formatTime} from '../../../../../../../lib/format';
import {useAppDispatch, useAppSelector} from '../../../../../../../redux/hooks';
import {updateUTXOStatus} from '../../../../../../../redux/slices/advancedStakesRewards';
import {poolV0ExitTimeSelector} from '../../../../../../../redux/slices/poolV0';
import {
    progressToNewWalletAction,
    registerWalletActionFailure,
    registerWalletActionSuccess,
    startWalletAction,
    StartWalletActionPayload,
} from '../../../../../../../redux/slices/web3WalletLastAction';
import {env} from '../../../../../../../services/env';
import {notifyError} from '../../../../../../../services/errors';
import {deriveRootKeypairs} from '../../../../../../../services/keychain';
import {exit} from '../../../../../../../services/pool';
import {
    UTXOStatus,
    AdvancedStakeRewards,
} from '../../../../../../../types/staking';
import RedeemRewardsWarningDialog from '../RedeemRewardsWarningDialog';

import './styles.scss';

function getButtonContents(
    exitTime: number | null,
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
    const {rewards} = props;

    const context = useWeb3React();
    const {account, chainId, library} = context;
    const dispatch = useAppDispatch();
    const exitTime = useAppSelector(poolV0ExitTimeSelector);

    const [warningDialogShown, setWarningDialogShown] = useState(false);

    const openWarningDialog = () => {
        setWarningDialogShown(true);
    };

    const handleRedeemButtonClick = () => {
        handleCloseWarningDialog();
        redeem();
    };

    const handleCloseWarningDialog = () => {
        setWarningDialogShown(false);
    };

    const redeem = useCallback(async () => {
        const trigger = 'zZKP redemption';
        dispatch(startWalletAction, {
            name: 'signMessage',
            cause: {caller: 'RedeemRewards', trigger},
            data: {account},
        } as StartWalletActionPayload);
        const signer = library.getSigner(account);
        const keys = await deriveRootKeypairs(signer);
        if (keys instanceof Error) {
            notifyError(
                'Panther wallet error',
                `Failed to generate Panther wallet secrets from signature: ${keys.message}`,
                keys,
            );
            dispatch(registerWalletActionFailure, 'signMessage');
            return;
        }
        dispatch(progressToNewWalletAction, {
            oldAction: 'signMessage',
            newAction: {
                name: 'exit',
                cause: {caller: 'PrivateBalance', trigger},
                data: {account, caller: 'redeem button'},
            },
        });

        const utxoStatus = await exit(
            library,
            account as string,
            chainId as number,
            rewards.utxoData,
            BigInt(rewards.id),
            Number(rewards.creationTime),
            rewards.commitments,
            keys,
        );
        dispatch(
            utxoStatus == UTXOStatus.UNDEFINED
                ? registerWalletActionFailure
                : registerWalletActionSuccess,
            'exit',
        );
        dispatch(updateUTXOStatus, [chainId, account, rewards.id, utxoStatus]);
    }, [dispatch, library, account, chainId, rewards]);

    const afterExitTime = exitTime ? exitTime * 1000 < Date.now() : false;
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
                onClick={() => openWarningDialog()}
            >
                {getButtonContents(exitTime, afterExitTime, treeUri)}
            </Button>
            {warningDialogShown && (
                <RedeemRewardsWarningDialog
                    handleClose={handleCloseWarningDialog}
                    handleRedeemButtonClick={handleRedeemButtonClick}
                />
            )}
        </Box>
    );
}
