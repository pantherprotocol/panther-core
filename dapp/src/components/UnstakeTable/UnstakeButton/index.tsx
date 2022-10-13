import React from 'react';

import {Box, Button, Typography} from '@mui/material';

import {formatTime} from '../../../lib/format';
import {useAppSelector} from '../../../redux/hooks';
import {
    walletActionCauseSelector,
    walletActionStatusSelector,
    WalletActionTrigger,
} from '../../../redux/slices/ui/web3WalletLastAction';
import {chainHasAdvancedStaking} from '../../../services/contracts';

import './styles.scss';

const UnstakeButton = (props: {
    row: any;
    chainId: number | undefined;
    unstakeById: (id: any, trigger: WalletActionTrigger) => Promise<void>;
}) => {
    const {row, chainId, unstakeById} = props;
    const walletActionCause = useAppSelector(walletActionCauseSelector);
    const walletActionStatus = useAppSelector(walletActionStatusSelector);

    const anotherUnstakingInProgress =
        walletActionCause?.trigger === 'unstake' &&
        walletActionStatus === 'in progress';

    const disabled =
        anotherUnstakingInProgress ||
        (chainHasAdvancedStaking(chainId) ? !row.unstakable : true);

    return (
        <Button
            data-testid="unstake-table_unstake-button_container"
            className={`unstake-button ${!row.unstakable ? 'locked' : ''}`}
            disabled={disabled}
            onClick={() => {
                unstakeById(row.id, 'unstake');
            }}
        >
            {row.unstakable ? (
                'Unstake'
            ) : (
                <Box>
                    <Typography>Locked Until:</Typography>
                    <Typography>{formatTime(row.lockedTill * 1000)}</Typography>
                </Box>
            )}
        </Button>
    );
};
export default UnstakeButton;
