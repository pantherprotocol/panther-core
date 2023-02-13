// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';
import {ReactElement, useState} from 'react';

import {Button, Box} from '@mui/material';
import {RedeemRewardProperties} from 'asset';
import {classnames} from 'components/common/classnames';
import RedeemRewardsWarningDialog from 'components/ZAssets/PrivateZAssetsTable/RedeemRewardsWarningDialog';
import dayjs from 'dayjs';
import {useAppSelector} from 'redux/hooks';
import {
    showWalletActionInProgressSelector,
    walletActionStatusSelector,
} from 'redux/slices/ui/web3-wallet-last-action';
import {
    poolV0ExitDelaySelector,
    poolV0ExitTimeSelector,
} from 'redux/slices/wallet/poolV0';

import './styles.scss';

function getButtonContents(inProgress: boolean): string | ReactElement {
    if (inProgress) return 'Redeeming';
    return 'Redeem zZKP';
}

const RedeemRewards = (props: RedeemRewardProperties) => {
    const {asset, isSelected, onSelectReward} = props;

    const exitTime = useAppSelector(poolV0ExitTimeSelector);

    const [warningDialogShown, setWarningDialogShown] =
        useState<boolean>(false);

    const showExitInProgress = useAppSelector(
        showWalletActionInProgressSelector('exit'),
    );

    const walletActionStatus = useAppSelector(walletActionStatusSelector);

    const anotherActionInProgress = walletActionStatus === 'in progress';

    const openWarningDialog = () => {
        onSelectReward(asset.id);
        setWarningDialogShown(true);
    };

    const handleCloseWarningDialog = () => {
        setWarningDialogShown(false);
    };

    const afterExitTime = exitTime ? exitTime * 1000 < Date.now() : false;

    const exitDelay = useAppSelector(poolV0ExitDelaySelector);
    const exitCommitmentTime = asset.exitCommitmentTime;

    const isLockPeriodPassed =
        exitCommitmentTime &&
        exitDelay &&
        exitCommitmentTime + exitDelay < dayjs().unix();

    const inExitCommitmentPeriod = exitCommitmentTime && !isLockPeriodPassed;
    const selectedInProgress = showExitInProgress && isSelected;
    const isRedemptionPossible =
        inExitCommitmentPeriod ||
        selectedInProgress ||
        !afterExitTime ||
        anotherActionInProgress;

    return (
        <Box>
            <Button
                variant="contained"
                className={classnames('redeem-button', {
                    'locked-button': isRedemptionPossible,
                })}
                disabled={
                    !afterExitTime ||
                    showExitInProgress ||
                    anotherActionInProgress
                }
                onClick={openWarningDialog}
            >
                {showExitInProgress && isSelected ? (
                    <>
                        <i
                            className="fa fa-refresh fa-spin"
                            style={{marginRight: '5px'}}
                        />
                        {getButtonContents(showExitInProgress)}
                    </>
                ) : (
                    <>{getButtonContents(false)}</>
                )}
            </Button>
            {warningDialogShown && (
                <RedeemRewardsWarningDialog
                    handleClose={handleCloseWarningDialog}
                    key={asset.id}
                    reward={asset}
                />
            )}
        </Box>
    );
};

export default RedeemRewards;
