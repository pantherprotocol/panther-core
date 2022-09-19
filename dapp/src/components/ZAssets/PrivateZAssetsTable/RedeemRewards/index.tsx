import * as React from 'react';
import {ReactElement, useState} from 'react';

import {Typography, Button, Box} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import rightSideArrow from '../../../../images/right-arrow-icon.svg';
import {formatTime} from '../../../../lib/format';
import {useAppSelector} from '../../../../redux/hooks';
import {poolV0ExitTimeSelector} from '../../../../redux/slices/poolV0';
import {showWalletActionInProgressSelector} from '../../../../redux/slices/web3WalletLastAction';
import {getCommitmentTreeUrl} from '../../../../services/env';
import {AdvancedStakeRewards} from '../../../../types/staking';
import RedeemRewardsWarningDialog from '../RedeemRewardsWarningDialog';

import './styles.scss';

function getButtonContents(
    inProgress: boolean,
    exitTime: number | null,
    afterExitTime: boolean,
    treeUri: string | undefined,
): string | ReactElement {
    if (inProgress) return 'Redeeming';
    if (afterExitTime) {
        if (!treeUri) {
            console.error(
                'No tree URL is provided. Redemption of rewards is not possible.',
            );

            return 'Redemption opens soon!';
        }
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

export default function RedeemRewards(props: {rewards: AdvancedStakeRewards}) {
    const {rewards} = props;

    const context = useWeb3React();
    const {chainId} = context;
    const exitTime = useAppSelector(poolV0ExitTimeSelector);

    const [warningDialogShown, setWarningDialogShown] = useState(false);
    const [selectedRewardId, setSelectedRewardId] = useState('');

    const openWarningDialog = (id: string) => {
        setWarningDialogShown(true);
        setSelectedRewardId(id);
    };

    const handleCloseWarningDialog = () => {
        setWarningDialogShown(false);
    };

    const showExitInProgress = useAppSelector(
        showWalletActionInProgressSelector('exit'),
    );

    const afterExitTime = exitTime ? exitTime * 1000 < Date.now() : false;
    const treeUri = getCommitmentTreeUrl(chainId!);
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
                onClick={() => openWarningDialog(rewards.id)}
            >
                {showExitInProgress && rewards.id === selectedRewardId ? (
                    <>
                        <i
                            className="fa fa-refresh fa-spin"
                            style={{marginRight: '5px'}}
                        />
                        {getButtonContents(
                            showExitInProgress,
                            exitTime!,
                            afterExitTime,
                            treeUri,
                        )}
                    </>
                ) : (
                    <>
                        {getButtonContents(
                            false,
                            exitTime!,
                            afterExitTime,
                            treeUri,
                        )}
                    </>
                )}
            </Button>
            {warningDialogShown && (
                <RedeemRewardsWarningDialog
                    handleClose={handleCloseWarningDialog}
                    rewards={rewards}
                />
            )}
        </Box>
    );
}
