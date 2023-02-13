// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

// import {MerklePath} from "./tree";
// import {Transaction} from "./transaction";
// import {UTXO} from "./utxo";
// import {Keypair, RootKeypair} from "./keypair";
//
// interface TransactionList {
//     transactions: [Transaction]
//     receivedCommitments: [UTXO]
// }
//
// export interface Wallet {
//     transactionList: TransactionList
//     treeHistoryConstant: number
//     lastBlockSync: string
//     startBlockSync: string
//     lastTreeNumber: string
//     masterKeyPair: RootKeypair
// }

export type WalletActionStatus =
    | 'in progress'
    | 'succeeded'
    | 'failed'
    | 'unknown'
    | 'none';

export type WalletSignatureTrigger =
    | 'undefined UTXOs'
    | 'manual refresh'
    | 'zZKP redemption'
    | 'register exit commitment'
    | 'unstake'
    | 'stake';

export type WalletActionName =
    | 'refreshUTXOsStatuses'
    | 'signMessage'
    | 'getAdvancedStakesRewards'
    | 'stake'
    | 'exit'
    | '';

// In the future, there may be other types of trigger
export type WalletActionTrigger = WalletSignatureTrigger;

export type Web3WalletActionCause = {
    caller: string;
    trigger: WalletActionTrigger;
};

export type StartWalletActionPayload = {
    name: WalletActionName;
    cause: Web3WalletActionCause;
    data: any;
};
