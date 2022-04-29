import React from 'react';

import {Box, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import {chainHasStakingOpen} from '../../../services/staking';
import {SafeMuiLink} from '../../Common/links';

import './styles.scss';

export default function StakingInfo() {
    const context = useWeb3React();
    const {chainId} = context;

    const subtitle = chainHasStakingOpen(chainId) ? (
        <>Staking will lock your tokens for a minimum of 7 days </>
    ) : (
        <>Classic staking is closed for new stakes</>
    );

    const text = chainHasStakingOpen(chainId) ? (
        <>
            You will need to unstake to collect your rewards. Rewards are not
            automatically staked. Unstaking is available after 7 days.
        </>
    ) : (
        <>
            The classic staking rewards program ends on May 4th, so new stakes
            were automatically disabled by the smart contracts on April 27th as{' '}
            <SafeMuiLink
                href="https://docs.pantherprotocol.io/launchdao/voting-proposals/3-launch/staking"
                underline="always"
                color="inherit"
            >
                previously
            </SafeMuiLink>{' '}
            <SafeMuiLink
                href="https://docs.pantherprotocol.io/dao/governance/proposal-3-polygon-extension/staking"
                underline="always"
                color="inherit"
            >
                scheduled
            </SafeMuiLink>
            .
            <p>
                You can still unstake{' '}
                <SafeMuiLink
                    href="https://docs.pantherprotocol.io/dao/support/faq/staking#when-unstake"
                    underline="always"
                    color="inherit"
                >
                    at any time
                </SafeMuiLink>
                , and there is no deadline for claiming rewards. On May 4th, the
                only change will be that rewards stop accruing.
            </p>
            <p>
                Also, advanced staking is now close!{' '}
                <SafeMuiLink
                    href="https://blog.pantherprotocol.io/advanced-staking-is-on-its-way-heres-how-to-prepare-for-it-b14cd01e4cc4"
                    underline="always"
                    color="inherit"
                >
                    Read more
                </SafeMuiLink>
                .
            </p>
        </>
    );

    return (
        <Box className="staking-info-container">
            <Typography variant="subtitle2" className="staking-info-title">
                {subtitle}
            </Typography>
            <Typography className="staking-info-text">{text}</Typography>
        </Box>
    );
}
