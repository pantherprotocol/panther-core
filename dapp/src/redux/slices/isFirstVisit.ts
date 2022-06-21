import {createSlice} from '@reduxjs/toolkit';

import {RootState} from '../store';

export interface FirstVisitState {
    value: boolean;
}

const initialState: FirstVisitState = {
    value: true,
};

export const firstVisitSlice = createSlice({
    name: 'firstVisit',
    initialState,
    reducers: {
        registerFirstVisit: state => {
            state.value = false;
        },
    },
});

export const {registerFirstVisit} = firstVisitSlice.actions;

export const firstVisitSelector = (state: RootState) => {
    return state.firstVisit?.value;
};

export default firstVisitSlice.reducer;
