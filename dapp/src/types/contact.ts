// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

export interface Contact {
    name: string;
    publicReadingKey: string;
    publicSpendingKey: string;
}

// MASP chain ID could be only on Polygon or Hardhat networks
export type MaspChainIds = 137 | 80001 | 31337;
