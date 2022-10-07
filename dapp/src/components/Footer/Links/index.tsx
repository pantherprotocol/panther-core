import React, {useState} from 'react';

import {Link} from 'react-router-dom';

import {SafeLink} from '../../Common/links';
import UserTerms from '../../ScrollableDialog';

import './styles.scss';

type NormalLink = {
    text: string;
    href: string;
};
type ActionLink = {
    text: string;
    onclick: (e: any) => void;
};

type LinkType = NormalLink | ActionLink;

function isNormalLink(link: LinkType): link is NormalLink {
    return 'href' in link;
}

const Links = () => {
    const [showUserTermsDialog, setShowUserTermsDialog] = useState(false);
    const handleCloseWarningDialog = () => {
        setShowUserTermsDialog(false);
    };

    const handleOpenWarningDialog = () => {
        setShowUserTermsDialog(true);
    };

    const linksData: LinkType[] = [
        {
            text: 'Docs & FAQs',
            href: 'https://docs.pantherprotocol.io/home/',
        },
        {
            text: 'Terms',
            onclick: handleOpenWarningDialog,
        },
        {
            text: 'Privacy Policy',
            href: 'https://www.pantherprotocol.io/privacy-policy',
        },
    ];
    return (
        <div className="adv-staking-footer-links">
            {linksData.map((link: LinkType, index) => (
                <div key={index}>
                    {isNormalLink(link) ? (
                        <SafeLink href={link.href}>{link.text}</SafeLink>
                    ) : (
                        <Link
                            to="#"
                            onClick={link.onclick}
                            data-testid={link.text}
                        >
                            {link.text}
                        </Link>
                    )}

                    {linksData.length !== index + 1 ? '|' : ''}
                </div>
            ))}

            {showUserTermsDialog && (
                <UserTerms
                    handleClose={handleCloseWarningDialog}
                    title="Terms of Service"
                />
            )}
        </div>
    );
};

export default Links;
