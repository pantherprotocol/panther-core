import React from 'react';

import {SafeLink} from '../../Common/links';

import './styles.scss';

const linksData = [
    {
        text: 'Docs & FAQs',
        href: 'https://docs.pantherprotocol.io/home/',
    },
    {
        text: 'Terms',
        href: 'https://www.pantherprotocol.io/privacy-policy',
    },
    {
        text: 'Privacy Policy',
        href: 'https://www.pantherprotocol.io/privacy-policy',
    },
];
const Links = () => {
    return (
        <div className="adv-staking-footer-links">
            {linksData.map((link, index) => (
                <div key={index}>
                    <SafeLink href={link.href}>{link.text}</SafeLink>
                    {linksData.length !== index + 1 ? '|' : ''}
                </div>
            ))}
        </div>
    );
};

export default Links;
