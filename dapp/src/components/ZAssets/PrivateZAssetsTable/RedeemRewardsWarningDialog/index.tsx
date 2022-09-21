import * as React from 'react';
import {useEffect} from 'react';

import {useAppDispatch} from '../../../../redux/hooks';
import {removeBlur, setBlur} from '../../../../redux/slices/blur';
import {AdvancedStakeRewards} from '../../../../types/staking';

import FirstStageRedeem from './FirstStageRedeem';
import SecondStageRedeem from './SecondStageRedeem';

import './styles.scss';

export default function RedeemRewardsWarningDialog(props: {
    handleClose: () => void;
    rewards: AdvancedStakeRewards;
}) {
    const {handleClose, rewards} = props;
    const dispatch = useAppDispatch();

    useEffect((): (() => any) => {
        dispatch(setBlur);
        return () => dispatch(removeBlur);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return rewards.exitCommitmentTime ? (
        <SecondStageRedeem
            {...{
                handleClose,
                rewards,
            }}
        />
    ) : (
        <FirstStageRedeem
            {...{
                handleClose,
                rewards,
            }}
        />
    );
}
