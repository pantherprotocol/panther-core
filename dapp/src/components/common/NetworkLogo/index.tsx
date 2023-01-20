// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import ethIcon from 'images/eth-logo.svg';
import maticIcon from 'images/polygon-logo.svg';
import {NetworkSymbol} from 'services/connectors';

const networkLogoMap = new Map<NetworkSymbol, string>([
    [NetworkSymbol.ETH, ethIcon],
    [NetworkSymbol.MATIC, maticIcon],
]);

export function networkLogo(networkSymbol: NetworkSymbol): string {
    return networkLogoMap.get(networkSymbol) || ethIcon;
}
