// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {combineReducers} from '@reduxjs/toolkit';

import advancedStakeInputRewardsReducer from './advanced-stake-predicted-rewards';
import remainingPrpRewardsReducer from './remaining-prp-rewards';
import stakeAmountReducer from './stake-amount';
import stakeTermsReducer from './stake-terms';
import stakesReducer from './stakes';
import totalUnclaimedClassicRewardsReducer from './total-unclaimed-classic-rewards';
import totalStakedReducer from './totals-of-advanced-stakes';
import zkpStakedBalanceReducer from './zkp-staked-balance';

export const stakingReducer = combineReducers({
    totalsOfAdvancedStakes: totalStakedReducer,
    zkpStakedBalance: zkpStakedBalanceReducer,
    advancedStakeInputRewards: advancedStakeInputRewardsReducer,
    stakeTerms: stakeTermsReducer,
    stakes: stakesReducer,
    totalUnclaimedClassicRewards: totalUnclaimedClassicRewardsReducer,
    stakeAmount: stakeAmountReducer,
    remainingPrpRewards: remainingPrpRewardsReducer,
});
