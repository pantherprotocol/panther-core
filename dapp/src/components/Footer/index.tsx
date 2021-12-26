import React from 'react';
import './styles.scss';
import twitter from './../../images/twitter-icon.svg';
import discord from './../../images/discord-icon.svg';
import telegram from './../../images/telegram-icon.svg';
import medium from './../../images/medium-icon.svg';

export default function Footer() {
    return (
        <div className="footer-holder">
            <div className="footer-container">
                <div className="socials">
                    <a href="https://twitter.com/ZkPanther">
                        <img src={twitter} alt="Twitter" />
                    </a>
                    <a href="https://discord.gg/WZuRnMCZ4c">
                        <img src={discord} alt="Discord" />
                    </a>
                    <a href="https://t.me/joinchat/GJ64F-nRiIF86Cxn">
                        <img src={telegram} alt="Telegram" />
                    </a>
                    <a href="https://blog.pantherprotocol.io/">
                        <img src={medium} alt="Medium" />
                    </a>
                </div>
            </div>
        </div>
    );
}
