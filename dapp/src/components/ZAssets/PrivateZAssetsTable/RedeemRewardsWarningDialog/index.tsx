import * as React from 'react';
import {useEffect} from 'react';

import {useAppDispatch} from 'redux/hooks';
import {removeBlur, setBlur} from 'redux/slices/ui/blur';
import {AdvancedStakeRewards} from 'types/staking';

import FirstStageRedeem from './FirstStageRedeem';
import SecondStageRedeem from './SecondStageRedeem';

import './styles.scss';

export default function RedeemRewardsWarningDialog(props: {
    handleClose: () => void;
    reward: AdvancedStakeRewards;
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
