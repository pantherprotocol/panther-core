import React from 'react';

import {Box, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import {useAppSelector} from '../../../redux/hooks';
import {isStakingOpenSelector} from '../../../redux/slices/stakeTerms';
import {StakeType} from '../../../types/staking';
import {SafeMuiLink} from '../../Common/links';

import './styles.scss';

export default function StakingInfo() {
    const context = useWeb3React();
    const {chainId} = context;
    const isStakingOpen = useAppSelector(
        isStakingOpenSelector(chainId!, StakeType.Advanced),
    );

    const subtitle = isStakingOpen ? (
        <>Staking will lock your tokens for a minimum of 7 days </>
    ) : (
        <>Classic staking is closed for new stakes</>
    );

    const text = isStakingOpen ? (
        <>
            You will need to unstake to collect your rewards. Rewards are not
            automatically staked. Unstaking is available after 7 days.
        </>
    ) : (
        <>
            <Typography>
                The classic staking rewards program ended on May 4th, so new
                stakes were automatically disabled by the smart contracts on
                April 27th as{' '}
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
            </Typography>
            <p>
                You can still unstake{' '}
                <SafeMuiLink
                    href="https://docs.pantherprotocol.io/dao/support/faq/staking#when-unstake"
                    underline="always"
                    color="inherit"
                >
                    at any time
                </SafeMuiLink>
                , and there is no deadline for claiming rewards. However active
                stakes have ceased to earn further rewards.
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
            <Box className="staking-info-text">{text}</Box>
        </Box>
    );
}
