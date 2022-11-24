// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

export interface Asset {
    name: string;
    symbol: string;
    decimals: number;
    contractAddress: string;
    createdAt: string;
    deploymentHash: string;
}
