import React from 'react';

import discord from '../../../images/discord-icon.png';
import medium from '../../../images/medium-icon.png';
import telegram from '../../../images/telegram-icon.png';
import twitter from '../../../images/twitter-icon.png';
import {SafeLink} from '../../Common/links';

import './styles.scss';

const socialData = [
    {
        href: 'https://twitter.com/ZkPanther',
        icon: {
            src: twitter,
            alt: 'Twitter',
        },
    },
    {
        href: 'https://discord.gg/WZuRnMCZ4c',
        icon: {
            src: discord,
            alt: 'Discord',
        },
    },
    {
        href: 'https://t.me/joinchat/GJ64F-nRiIF86Cxn',
        icon: {
            src: telegram,
            alt: 'Telegram',
        },
    },
    {
        href: 'https://blog.pantherprotocol.io/',
        icon: {
            src: medium,
            alt: 'Medium',
        },
    },
];
const Socials = () => {
    return (
        <div className="adv-staking-footer-socials">
            {socialData.map((social, index) => (
                <SafeLink href={social.href} key={index}>
                    <img src={social.icon.src} alt={social.icon.alt} />
                </SafeLink>
            ))}
        </div>
    );
};

export default Socials;
