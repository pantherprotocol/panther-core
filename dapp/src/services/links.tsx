import React, {ReactElement} from 'react';

import {Link} from '@mui/material';

import {STAKING_CONTRACT} from './contracts';

export const SafeLink = (props: {
    href: string;
    children: string | ReactElement;
}): ReactElement => (
    <a href={props.href} target="_blank" rel="noopener noreferrer">
        {props.children}
    </a>
);

export const SafeMuiLink = (props: {
    [key: string]: any;
    children: string | ReactElement;
}): ReactElement => (
    <Link {...props} target="_blank" rel="noopener noreferrer">
        {props.children}
    </Link>
);

export const linkTextToTx = (
    text: string,
    txHash: string | null,
): ReactElement => {
    if (!txHash || !process.env.BLOCK_EXPLORER) {
        return <span>{text}</span>;
    }
    return (
        <SafeLink href={process.env.BLOCK_EXPLORER + 'tx/' + txHash}>
            {text}
        </SafeLink>
    );
};

export const linkTextToAddress = (
    text: string,
    address: string | null | undefined,
): ReactElement => {
    if (!address || !process.env.BLOCK_EXPLORER) {
        return <span>{address}</span>;
    }
    return (
        <SafeLink href={process.env.BLOCK_EXPLORER + 'address/' + address}>
            {text}
        </SafeLink>
    );
};

export const linkTextToStakingContract = (text: string): ReactElement => {
    return linkTextToAddress(text, STAKING_CONTRACT);
};

export const safeWindowOpen = (URL: string, options?: Array<string>): void => {
    window.open(
        URL,
        '_blank',
        ['noopener', 'noreferrer'].concat(options || []).join(','),
    );
};

export const METAMASK_HOMEPAGE = 'https://metamask.io';

export const safeOpenMetamask = (): void => {
    safeWindowOpen(METAMASK_HOMEPAGE);
};
