// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {UTXO} from 'types/utxo';
export interface Asset {
    name: string;
    symbol: string;
    decimals: number;
    contractAddress: string;
    createdAt: string;
    deploymentHash: string;
}

export type RedeemRewardProperties = {
    asset: UTXO;
    isSelected: boolean;
    onSelectReward: (rewardId: string | undefined) => void;
};

export type AssetsDetailsRowProperties = RedeemRewardProperties;
