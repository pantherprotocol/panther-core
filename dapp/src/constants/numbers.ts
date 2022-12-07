// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {BigNumber} from 'ethers';

export const toBN = (n: number | string): BigNumber => BigNumber.from(n);

export const DECIMALS = 18; //18 decimal places after floating point
export const E18 = toBN(10).pow(toBN(DECIMALS));
