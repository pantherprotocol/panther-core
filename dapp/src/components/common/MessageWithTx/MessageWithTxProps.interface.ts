// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

export interface MessageWithTxProps {
    message: string;
    chainId?: number;
    linkText?: string;
    txHash?: string;
}
