// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {Button} from '@mui/material';
import {classnames} from 'components/common/classnames';
import {useAppSelector} from 'redux/hooks';
import {
    walletActionCauseSelector,
    walletActionStatusSelector,
} from 'redux/slices/ui/web3-wallet-last-action';
import {chainHasAdvancedStaking} from 'services/contracts';
import {WalletActionTrigger} from 'wallet';

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
            data-testid="stake-list_stake-button_container"
            className={classnames('unstake-button', {locked: !row.unstakable})}
            disabled={disabled}
            onClick={() => {
                unstakeById(row.id, 'unstake');
            }}
        >
            Unstake
        </Button>
    );
};
export default UnstakeButton;
