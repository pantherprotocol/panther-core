// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {BigNumber} from 'ethers';

export type StakeTypes = 'classic' | 'advanced';

export enum StakeType {
    Classic = 'classic',
    Advanced = 'advanced',
}

export type StakeReward = {
    // BigNumber string to allow serialization in Redux
    [key in StakingRewardTokenID]?: string | null;
};
export type StakeRewardsBN = {
    [key in StakingRewardTokenID]?: BigNumber | null;
};
export type StakeRewardBN = ClassicStakeRewardBN | AdvancedStakeRewardsBN;

export type ClassicStakeRewardBN = BigNumber;

export type AdvancedStakeRewardsBN = {
    [key in AdvancedStakeTokenIDs]: BigNumber;
};

export type AdvancedStakeTokenIDs = 'PRP' | 'zZKP';

export enum StakingRewardTokenID {
    ZKP = 'ZKP',
    zZKP = 'zZKP',
    PRP = 'PRP',
}
