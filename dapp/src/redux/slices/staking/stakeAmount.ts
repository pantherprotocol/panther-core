// eslint-disable-next-line
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {safeParseUnits} from '../../../lib/numbers';
import {RootState} from '../../store';

interface StakeAmountState {
    value: string;
}

const initialState: StakeAmountState = {
    value: '',
};

export const stakeAmountSlice = createSlice({
    name: 'staking/stakeAmount',
    initialState,
    reducers: {
        set: (state, action: PayloadAction<string>): void => {
            if (!safeParseUnits(action.payload))
                throw new Error(
                    `The value ${action.payload} isn't parsiable as Bignumber`,
                );

            state.value = action.payload;
        },
        reset: state => {
            state.value = initialState.value;
        },
    },
});

export const stakeAmountSelector = (state: RootState): string => {
    return state.staking.stakeAmount.value;
};

export const {set: setStakeAmount, reset: resetStakeAmount} =
    stakeAmountSlice.actions;

export default stakeAmountSlice.reducer;
