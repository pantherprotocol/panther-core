// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {SafeLink} from 'components/Common/links';
import useScreenSize from 'hooks/screen';
import discordGray from 'images/discord-icon-gray.svg';
import discord from 'images/discord-icon.png';
import mediumGray from 'images/medium-icon-gray.svg';
import medium from 'images/medium-icon.png';
import telegramGray from 'images/telegram-icon-gray.svg';
import telegram from 'images/telegram-icon.png';
import twitterGray from 'images/twitter-icon-gray.svg';
import twitter from 'images/twitter-icon.png';

import './styles.scss';

const Socials = () => {
    const {isMobile} = useScreenSize();

    const socialData = [
        {
            href: 'https://twitter.com/ZkPanther',
            icon: {
                src: isMobile ? twitterGray : twitter,
                alt: 'Twitter',
            },
        },
        {
            href: 'https://discord.gg/WZuRnMCZ4c',
            icon: {
                src: isMobile ? discordGray : discord,
                alt: 'Discord',
            },
        },
        {
            href: 'https://t.me/joinchat/GJ64F-nRiIF86Cxn',
            icon: {
                src: isMobile ? telegramGray : telegram,
                alt: 'Telegram',
            },
        },
        {
            href: 'https://blog.pantherprotocol.io/',
            icon: {
                src: isMobile ? mediumGray : medium,
                alt: 'Medium',
            },
        },
    ];

    return (
        <div
            className="adv-staking-footer-socials"
            data-testid="footer-social-links"
        >
            {socialData.map((social, index) => (
                <SafeLink href={social.href} key={index}>
                    <img src={social.icon.src} alt={social.icon.alt} />
                </SafeLink>
            ))}
        </div>
    );
};

export default Socials;
