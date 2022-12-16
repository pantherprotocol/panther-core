// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {env} from 'services/env';

export enum Routes {
    Staking = '/',
    ZAssets = '/zAssets',
    Faucet = '/faucet',
    Contracts = '/contracts',
}

const GOVERNANCE_LINK = 'https://snapshot.org/#/pantherprotocol.eth';
const DOCS_LINK = 'https://docs.pantherprotocol.io/home/';

export type MenuLink = {
    name: string;
    url: string;
};

function createLink(name: string, route: Routes | string): MenuLink {
    return Object.freeze({
        name,
        url: route.toString(),
    });
}

const isFaucetMode = env.APP_MODE === 'faucet';
const stakingLink = createLink(
    'Staking',
    isFaucetMode ? `${env.FAUCET_BASE_URL}` : Routes.Staking,
);
const zAssetsLink = createLink(
    'zAssets',
    isFaucetMode ? `${env.FAUCET_BASE_URL}${Routes.ZAssets}` : Routes.ZAssets,
);
const faucetLink = createLink('Faucet', Routes.Faucet);
const governanceLink = createLink('Governance', GOVERNANCE_LINK);
const docsLink = createLink('Docs', DOCS_LINK);

export function getHeaderLinks({
    includeFaucet,
}: {
    includeFaucet: boolean;
}): MenuLink[] {
    if (isFaucetMode) return [stakingLink, zAssetsLink];

    const links: MenuLink[] = [
        stakingLink,
        zAssetsLink,
        governanceLink,
        docsLink,
    ];

    if (includeFaucet) links.push(faucetLink);

    return links;
}

export const footerLinks: MenuLink[] = [
    stakingLink,
    zAssetsLink,
    governanceLink,
];
