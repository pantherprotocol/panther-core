// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {AdvancedStakeRewards} from 'types/staking';

export type AssetsDetailsRowProperties = {
    reward: AdvancedStakeRewards;
    isSelected: boolean;
    onSelectReward: (rewardId: string | undefined) => void;
};
