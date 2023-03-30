// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {utils} from 'ethers';
import {invertMap} from 'lib/helpers';
import {StakeTypes} from 'types/staking';

export const CLASSIC_TYPE_HEX = utils.id('classic').slice(0, 10);
export const ADVANCED_TYPE_HEX = utils.id('advanced').slice(0, 10);
export const ADVANCED_2_TYPE_HEX = utils.id('advanced-v2').slice(0, 10);

export const HEX_STAKE_TYPE_TO_STAKE_TYPE = new Map<string, StakeTypes>([
    [CLASSIC_TYPE_HEX, 'classic'],
    [ADVANCED_TYPE_HEX, 'advanced'],
    [ADVANCED_2_TYPE_HEX, 'advanced-v2'],
]);

export const STAKE_TYPE_TO_HEX_STAKE_TYPE = invertMap(
    HEX_STAKE_TYPE_TO_STAKE_TYPE,
);
