import * as React from 'react';
import {ReactElement, useState} from 'react';

import {Typography, Button, Box} from '@mui/material';
import RedeemRewardsWarningDialog from 'components/ZAssets/PrivateZAssetsTable/RedeemRewardsWarningDialog';
import rightSideArrow from 'images/right-arrow-icon.svg';
import {formatTime} from 'lib/format';
import {useAppSelector} from 'redux/hooks';
import {showWalletActionInProgressSelector} from 'redux/slices/ui/web3-wallet-last-action';
import {poolV0ExitTimeSelector} from 'redux/slices/wallet/poolV0';

import {RedeemRewardProperties} from './RedeemReward.interface';

import './styles.scss';

function getButtonContents(
    inProgress: boolean,
    exitTime: number | null,
    afterExitTime: boolean,
): string | ReactElement {
    if (inProgress) return 'Redeeming';
    if (afterExitTime) {
        return 'Redeem zZKP';
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

const RedeemRewards = (props: RedeemRewardProperties) => {
    const {reward, isSelected, onSelectReward} = props;

    const exitTime = useAppSelector(poolV0ExitTimeSelector);

    const [warningDialogShown, setWarningDialogShown] =
        useState<boolean>(false);

    const showExitInProgress = useAppSelector(
        showWalletActionInProgressSelector('exit'),
    );

    const openWarningDialog = () => {
        onSelectReward(reward.id);
        setWarningDialogShown(true);
    };

    const handleCloseWarningDialog = () => {
        setWarningDialogShown(false);
    };

    const afterExitTime = exitTime ? exitTime * 1000 < Date.now() : false;
    const isRedemptionPossible = afterExitTime;

    return (
        <Box>
            <Button
                variant="contained"
                className="redeem-button"
                endIcon={
                    !(showExitInProgress && isSelected) ? (
                        <img src={rightSideArrow} />
                    ) : null
                }
                disabled={!isRedemptionPossible || showExitInProgress}
                onClick={openWarningDialog}
            >
                {showExitInProgress && isSelected ? (
                    <>
                        <i
                            className="fa fa-refresh fa-spin"
                            style={{marginRight: '5px'}}
                        />
                        {getButtonContents(
                            showExitInProgress,
                            exitTime!,
                            afterExitTime,
                        )}
                    </>
                ) : (
                    <>{getButtonContents(false, exitTime!, afterExitTime)}</>
                )}
            </Button>
            {warningDialogShown && (
                <RedeemRewardsWarningDialog
                    handleClose={handleCloseWarningDialog}
                    key={reward.id}
                    reward={reward}
                />
            )}
        </Box>
    );
};

export default RedeemRewards;
