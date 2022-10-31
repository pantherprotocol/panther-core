import React, {useState} from 'react';

import {SafeLink} from 'components/Common/links';
import UserTerms from 'components/ScrollableDialog';
import useScreenSize from 'hooks/screen';
import {Link} from 'react-router-dom';

import './styles.scss';

type Hyperlink = {
    text: string;
    href: string;
};
type ActionLink = {
    text: string;
    onclick: (e: any) => void;
};
type RouteLink = {
    name: string;
    to: string;
};

type LinkType = Hyperlink | ActionLink;
type RouteType = Hyperlink | RouteLink;

const Links = () => {
    const {isMobile} = useScreenSize();
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

    const routesData: RouteType[] = [
        {
            name: 'Staking',
            to: '/',
        },
        {
            name: 'zAssets',
            to: '/zAssets',
        },
        {
            text: 'Governance',
            href: 'https://snapshot.org/#/pantherprotocol.eth',
        },
    ];

    const createLink = (linkObj: LinkType | RouteType) => {
        if ('href' in linkObj) {
            return <SafeLink href={linkObj.href}>{linkObj.text}</SafeLink>;
        } else {
            if ('onclick' in linkObj) {
                return (
                    <Link
                        to="#"
                        onClick={linkObj.onclick}
                        data-testid={linkObj.text}
                    >
                        {linkObj.text}
                    </Link>
                );
            } else {
                return <Link to={linkObj.to}>{linkObj.name}</Link>;
            }
        }
    };

    return (
        <div className="adv-staking-footer-links">
            {!isMobile &&
                linksData.map((link: LinkType, index) => (
                    <div key={index}>
                        {createLink(link)}
                        <span className="separator">
                            {linksData.length !== index + 1 ? '|' : ''}
                        </span>
                    </div>
                ))}

            {isMobile &&
                routesData.map((route: RouteType, index) => (
                    <div key={index} className="footer-route">
                        {createLink(route)}
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
