// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {IKeypair} from '@panther-core/crypto/lib/types/keypair';

import {Asset} from './asset';
import {ICommitment} from './event';

//should have commitment and nullifier wit utxo as base class

export interface UTXO {
    startTime: Date;
    endTime: Date;
    amount: bigint;
    asset: Asset;
    //tree: bigint
    leafIndex: number;
    commitment: ICommitment;
}

export interface InUTXO extends UTXO {
    nullifier: string;
    keypair: IKeypair;
}

export interface OutUTXO {
    publicKey: bigint;
}
