// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {zAsset} from './z-asset';

export type UTXO = {
    id: string;
    creationTime: number;
    commitment: string;
    data: string;
    status: UTXOStatus;
    amount: string;
    exitCommitmentTime?: number;
    asset?: zAsset; // TODO: making this optional for now, but it should be required
};

export enum UTXOStatus {
    UNDEFINED = 'undefined',
    UNSPENT = 'unspent',
    SPENT = 'spent',
}

export type UTXOStatusByID = [string, UTXOStatus];
