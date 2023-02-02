// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {UTXO} from 'types/utxo';

export type AssetsDetailsRowProperties = {
    asset: UTXO;
    isSelected: boolean;
    onSelectReward: (rewardId: string | undefined) => void;
};
