// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';
import {useEffect} from 'react';

import {useAppDispatch} from 'redux/hooks';
import {removeBlur, setBlur} from 'redux/slices/ui/blur';
import {UTXO} from 'types/utxo';

import FirstStageRedeem from './FirstStageRedeem';
import SecondStageRedeem from './SecondStageRedeem';

import './styles.scss';

export default function RedeemRewardsWarningDialog(props: {
    handleClose: () => void;
    reward: UTXO;
}) {
    const {handleClose, reward} = props;
    const dispatch = useAppDispatch();

    useEffect((): (() => any) => {
        dispatch(setBlur);
        return () => dispatch(removeBlur);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return reward.exitCommitmentTime ? (
        <SecondStageRedeem
            {...{
                handleClose,
                reward,
            }}
        />
    ) : (
        <FirstStageRedeem
            {...{
                handleClose,
                reward,
            }}
        />
    );
}
