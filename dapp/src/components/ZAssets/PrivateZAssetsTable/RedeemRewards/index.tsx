import * as React from 'react';
import {ReactElement, useCallback, useState} from 'react';

import {Typography, Button, Box} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import rightSideArrow from '../../../../images/right-arrow-icon.svg';
import {parseTxErrorMessage} from '../../../../lib/errors';
import {awaitConfirmationAndRetrieveEvent} from '../../../../lib/events';
import {formatTime} from '../../../../lib/format';
import {useAppDispatch, useAppSelector} from '../../../../redux/hooks';
import {updateUTXOStatus} from '../../../../redux/slices/advancedStakesRewards';
import {poolV0ExitTimeSelector} from '../../../../redux/slices/poolV0';
import {
    progressToNewWalletAction,
    registerWalletActionFailure,
    registerWalletActionSuccess,
    showWalletActionInProgressSelector,
    startWalletAction,
    StartWalletActionPayload,
} from '../../../../redux/slices/web3WalletLastAction';
import {env} from '../../../../services/env';
import {deriveRootKeypairs} from '../../../../services/keychain';
import {exit} from '../../../../services/pool';
import {isDetailedError} from '../../../../types/error';
import {UTXOStatus, AdvancedStakeRewards} from '../../../../types/staking';
import {notifyError} from '../../../Common/errors';
import {
    openNotification,
    removeNotification,
} from '../../../Common/notification';
import RedeemRewardsWarningDialog from '../RedeemRewardsWarningDialog';

import './styles.scss';

function getButtonContents(
    inProgress: boolean,
    exitTime: number | null,
    afterExitTime: boolean,
    treeUri: string | undefined,
): string | ReactElement {
    if (inProgress) return 'Redeeming zZKP';
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

    const showExitInProgress = useAppSelector(
        showWalletActionInProgressSelector('exit'),
    );

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
            notifyError({
                message: 'Panther wallet error',
                details: `Failed to generate Panther wallet secrets from signature: ${keys.message}`,
                triggerError: keys,
            });
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

        const [res1, res2] = await exit(
            library,
            account as string,
            chainId as number,
            rewards.utxoData,
            BigInt(rewards.id),
            Number(rewards.creationTime),
            rewards.commitments,
            keys,
        );
        if (isDetailedError(res2)) {
            const [utxoStatue, err] = [res1, res2];
            dispatch(
                utxoStatue == UTXOStatus.UNDEFINED
                    ? registerWalletActionFailure
                    : registerWalletActionSuccess,
                'exit',
            );
            dispatch(updateUTXOStatus, [
                chainId,
                account,
                rewards.id,
                utxoStatue,
            ]);
            return notifyError(err);
        } else {
            //in this case the exit function returned [null,transaction]
            const [, tx] = [, res2];

            const inProgress = openNotification(
                'Transaction in progress',
                'Your withdrawal transaction is currently in progress. Please wait for confirmation!',
                'info',
            );

            const event = await awaitConfirmationAndRetrieveEvent(
                tx,
                'Nullifier',
            );
            removeNotification(inProgress);

            if (event instanceof Error) {
                dispatch(registerWalletActionSuccess, 'exit');
                dispatch(updateUTXOStatus, [
                    chainId,
                    account,
                    rewards.id,
                    UTXOStatus.UNDEFINED,
                ]);

                return notifyError({
                    message: 'Transaction error',
                    details: `Cannot find event in receipt: ${parseTxErrorMessage(
                        event,
                    )}`,
                    triggerError: event,
                });
            }
            dispatch(registerWalletActionSuccess, 'exit');
            dispatch(updateUTXOStatus, [
                chainId,
                account,
                rewards.id,
                UTXOStatus.SPENT,
            ]);

            openNotification(
                'Withdrawal completed successfully',
                'Congratulations! Your withdrawal transaction was processed!',
                'info',
                10000,
            );
        }
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
                    isRedemptionPossible && !showExitInProgress ? (
                        <img src={rightSideArrow} />
                    ) : null
                }
                disabled={!isRedemptionPossible || showExitInProgress}
                onClick={() => openWarningDialog()}
            >
                {showExitInProgress && (
                    <i
                        className="fa fa-refresh fa-spin"
                        style={{marginRight: '5px'}}
                    />
                )}
                {getButtonContents(
                    showExitInProgress,
                    exitTime,
                    afterExitTime,
                    treeUri,
                )}
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
