// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useCallback, useEffect} from 'react';

import {UNSTAKE_ROWS_PER_PAGE} from 'constants/pagination';

import {Box} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {MessageWithTx} from 'components/common/MessageWithTx';
import {
    removeNotification,
    openNotification,
} from 'components/common/notification';
import Pagination from 'components/common/Pagination';
import {BigNumber} from 'ethers';
import usePagination from 'hooks/pagination';
import {awaitConfirmationAndRetrieveEvent} from 'lib/events';
import {useAppDispatch} from 'redux/hooks';
import {getStakes, useStakes} from 'redux/slices/staking/stakes';
import {getTotalUnclaimedClassicRewards} from 'redux/slices/staking/total-unclaimed-classic-rewards';
import {getTotalsOfAdvancedStakes} from 'redux/slices/staking/totals-of-advanced-stakes';
import {getZkpStakedBalance} from 'redux/slices/staking/zkp-staked-balance';
import {
    registerWalletActionFailure,
    registerWalletActionSuccess,
    startWalletAction,
    StartWalletActionPayload,
    WalletActionTrigger,
} from 'redux/slices/ui/web3-wallet-last-action';
import {getChainBalance} from 'redux/slices/wallet/chain-balance';
import {getZkpTokenBalance} from 'redux/slices/wallet/zkp-token-balance';
import {MultiError} from 'services/errors';
import {StakeRow, unstake} from 'services/staking';

import UnstakeRow from './StakeItem';

import './styles.scss';

async function unstakeWithNotification(
    library: any,
    chainId: number,
    account: string,
    stakeID: BigNumber,
    data: string | undefined,
) {
    const [tx, err] = await unstake(
        library,
        chainId,
        account,
        stakeID,
        data,
        false,
    );

    if (err) {
        openNotification(
            'Transaction error',
            <MessageWithTx
                message={err.message}
                chainId={chainId}
                txHash={tx?.hash}
            />,
            'danger',
        );
        return err;
    }

    const inProgress = openNotification(
        'Transaction in progress',
        <MessageWithTx
            message="Your unstaking transaction is currently in progress. Please wait for confirmation!"
            chainId={chainId}
            txHash={tx?.hash}
        />,

        'info',
    );

    const event = await awaitConfirmationAndRetrieveEvent(tx, 'StakeClaimed');
    removeNotification(inProgress);

    if (event instanceof MultiError) {
        openNotification(
            'Transaction error',
            <MessageWithTx
                message={event.message}
                txHash={tx?.hash}
                chainId={chainId}
            />,
            'danger',
        );
        return err;
    }

    openNotification(
        'Unstaking completed successfully',
        <MessageWithTx
            message="Congratulations! Your unstaking transaction was processed!"
            txHash={tx?.hash}
            chainId={chainId}
        />,

        'info',
        10000,
    );
}

export default function StakeList() {
    const context = useWeb3React();
    const {library, chainId, account} = context;
    const dispatch = useAppDispatch();
    const {stakes} = useStakes();
    const filteredStakes = stakes.filter(stake => stake.claimedAt == 0);

    const {
        paginatedData,
        onLastClick,
        currentPage,
        setCurrentPage,
        totalPages,
        onNextClick,
        onPrevClick,
        maxPageLimit,
        minPageLimit,
    } = usePagination({
        data: filteredStakes,
        itemsPerPage: UNSTAKE_ROWS_PER_PAGE,
    });

    const unstakeById = useCallback(
        async (id, trigger: WalletActionTrigger) => {
            if (!library || !chainId || !account) {
                return;
            }
            dispatch(startWalletAction, {
                name: 'signMessage',
                cause: {caller: 'UnstakeTab', trigger},
                data: {account},
            } as StartWalletActionPayload);

            const stakeID = BigNumber.from(id);
            const data = '0x00';

            const response = await unstakeWithNotification(
                library,
                chainId,
                account,
                stakeID,
                data,
            );
            if (response !== undefined) {
                dispatch(registerWalletActionFailure, 'signMessage');
                return;
            }
            dispatch(registerWalletActionSuccess, 'signMessage');

            dispatch(getTotalsOfAdvancedStakes, context);
            dispatch(getZkpStakedBalance, context);
            dispatch(getTotalUnclaimedClassicRewards, context);
            dispatch(getZkpTokenBalance, context);
            dispatch(getChainBalance, context);
            dispatch(getStakes, context);
        },
        [library, chainId, account, context, dispatch],
    );

    useEffect(() => {
        dispatch(getStakes, context);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [library, chainId, account]);

    return (
        <Box
            className="stake-list"
            data-testid="stake-list_stake-list_container"
        >
            {paginatedData().map((row: StakeRow) => (
                <UnstakeRow
                    key={row.stakedAt}
                    row={row}
                    unstakeById={unstakeById}
                    chainId={chainId}
                />
            ))}
            {filteredStakes.length !== 0 &&
                filteredStakes.length > UNSTAKE_ROWS_PER_PAGE && (
                    <Pagination
                        totalPages={totalPages}
                        currentPage={currentPage}
                        maxPageLimit={maxPageLimit}
                        minPageLimit={minPageLimit}
                        onPrevClick={onPrevClick}
                        onNextClick={onNextClick}
                        onLastClick={onLastClick}
                        setCurrentPage={setCurrentPage}
                    />
                )}
        </Box>
    );
}
