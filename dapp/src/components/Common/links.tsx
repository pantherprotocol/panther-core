import React, {ReactElement} from 'react';

import {Link} from '@mui/material';

import {ContractName, getContractAddress} from '../../services/contracts';
import {env} from '../../services/env';

export function SafeLink(props: {
    href: string;
    children: string | ReactElement;
}): ReactElement {
    return (
        <a href={props.href} target="_blank" rel="noopener noreferrer">
            {props.children}
        </a>
    );
}

export const SafeMuiLink = (props: {
    [key: string]: any;
    children: string | ReactElement;
}): ReactElement => (
    <Link {...props} target="_blank" rel="noopener noreferrer">
        {props.children}
    </Link>
);

function getBlockExplorerURL(chainId: number): string {
    const varName = `BLOCK_EXPLORER_${chainId}`;
    const explorerURL: string | undefined = env[varName];
    if (!explorerURL) {
        throw `${varName} not defined`;
    }
    console.debug(`Resolved ${varName} as ${explorerURL}`);
    return explorerURL;
}

export function addressLink(chainId: number, address: string): string {
    const explorerURL = getBlockExplorerURL(chainId);
    return explorerURL + 'address/' + address;
}

export function txLink(chainId: number, txHash: string): string {
    const explorerURL = getBlockExplorerURL(chainId);
    return explorerURL + 'tx/' + txHash;
}

export function linkTextToTx(
    chainId: number | undefined,
    text: string,
    txHash: string | null,
): ReactElement {
    if (!txHash || !chainId) {
        return <span>{text}</span>;
    }
    return <SafeLink href={txLink(chainId, txHash)}>{text}</SafeLink>;
}

export const linkTextToAddress = (
    chainId: number | undefined,
    text: string,
    address: string,
): ReactElement => {
    if (!address || !chainId) {
        return <span>{address}</span>;
    }
    return <SafeLink href={addressLink(chainId, address)}>{text}</SafeLink>;
};

export const linkTextToStakingContract = (
    chainId: number,
    text: string,
): ReactElement => {
    const address = getContractAddress(ContractName.STAKING, chainId);
    return linkTextToAddress(chainId, text, address);
};

export const safeWindowOpen = (url: string, options?: Array<string>): void => {
    window.open(
        url,
        '_blank',
        ['noopener', 'noreferrer'].concat(options || []).join(','),
    );
};

export const METAMASK_HOMEPAGE = 'https://metamask.io';

export const safeOpenMetamask = (): void => {
    safeWindowOpen(METAMASK_HOMEPAGE);
};
