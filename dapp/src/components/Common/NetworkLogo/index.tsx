// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import ethIcon from 'images/eth-logo.svg';
import maticIcon from 'images/polygon-logo.svg';

export function networkLogo(logoName: string): string {
    if (logoName === 'MATIC') {
        return maticIcon;
    }

    if (logoName === 'ETH') {
        return ethIcon;
    }

    // fallback to default Ethereum logo
    return ethIcon;
}
