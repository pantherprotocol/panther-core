import {createSlice} from '@reduxjs/toolkit';

import {RootState} from '../store';

export interface BlurState {
    value: boolean;
}

const initialState: BlurState = {
    value: false,
};

export const blurSlice = createSlice({
    name: 'blur',
    initialState,
    reducers: {
        setBlur: state => {
            state.value = true;
        },
        removeBlur: state => {
            state.value = false;
        },
    },
});

export const {setBlur, removeBlur} = blurSlice.actions;

export const blurSelector = (state: RootState) => {
    return state.blur?.value;
};

export default blurSlice.reducer;
