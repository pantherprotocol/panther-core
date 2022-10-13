import {createSlice} from '@reduxjs/toolkit';

import {RootState} from '../../store';

export interface BlurState {
    value: boolean;
}

const initialState: BlurState = {
    value: false,
};

export const blurSlice = createSlice({
    name: 'ui/blur',
    initialState,
    reducers: {
        set: state => {
            state.value = true;
        },
        remove: state => {
            state.value = false;
        },
    },
});

export const {set: setBlur, remove: removeBlur} = blurSlice.actions;

export const blurSelector = (state: RootState) => {
    return state.ui.blur?.value;
};

export default blurSlice.reducer;
