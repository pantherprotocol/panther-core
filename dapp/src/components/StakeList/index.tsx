// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useCallback, useEffect, useState} from 'react';

import {
    MAX_PAGE_LIMIT,
    MAX_PAGE_LIMIT_MOBILE,
    UNSTAKE_ROWS_PER_PAGE,
} from 'constants/pagination';

import {Box} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {MessageWithTx} from 'components/Common/MessageWithTx';
import {
    removeNotification,
    openNotification,
} from 'components/Common/notification';
import Pagination from 'components/Common/Pagination';
import {BigNumber} from 'ethers';
import useScreenSize from 'hooks/screen';
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
import {parseTxErrorMessage} from 'services/errors';
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
                message={parseTxErrorMessage(err)}
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

    if (event instanceof Error) {
        openNotification(
            'Transaction error',
            <MessageWithTx
                message={parseTxErrorMessage(event)}
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
    const {isSmall} = useScreenSize();
    const responsiveLimit = isSmall ? MAX_PAGE_LIMIT_MOBILE : MAX_PAGE_LIMIT;

    const [currentPage, setCurrentPage] = useState(1);
    const [maxPageLimit, setMaxPageLimit] = useState(responsiveLimit);
    const [minPageLimit, setMinPageLimit] = useState(0);

    const indexOfLastStake = currentPage * UNSTAKE_ROWS_PER_PAGE;
    const indexOfFirstStake = indexOfLastStake - UNSTAKE_ROWS_PER_PAGE;
    const filteredStakes = stakes.filter(stake => stake.claimedAt == 0);
    const paginatedStakes = filteredStakes.slice(
        indexOfFirstStake,
        indexOfLastStake,
    );

    const totalPages = Math.ceil(stakes.length / UNSTAKE_ROWS_PER_PAGE);

    const onPageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const onPrevClick = () => {
        if (currentPage - 1 <= minPageLimit) {
            setMaxPageLimit(maxPageLimit - 1);
            setMinPageLimit(minPageLimit - 1);
        }
        setCurrentPage(prev => prev - 1);
    };

    const onNextClick = () => {
        if (currentPage + 1 > maxPageLimit) {
            setMaxPageLimit(maxPageLimit + 1);
            setMinPageLimit(minPageLimit + 1);
        }
        setCurrentPage(prev => prev + 1);
    };

    const onLastClick = (total: number) => {
        onPageChange(total);
        setMaxPageLimit(total);
        setMinPageLimit(total - responsiveLimit);
    };

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
            {paginatedStakes.map((row: StakeRow) => (
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
                        onPageChange={onPageChange}
                    />
                )}
        </Box>
    );
}
