import React, {ReactElement, useCallback} from 'react';

import {Typography, Card, CardContent} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import {useAppSelector} from '../../../redux/hooks';
import {
    isStakingOpenSelector,
    termsSelector,
} from '../../../redux/slices/stakeTerms';
import {chainHasAdvancedStaking} from '../../../services/contracts';
import {StakeType} from '../../../types/staking';
import {formatTime} from '../../../utils/helpers';
import {SafeMuiLink} from '../../Common/links';

import './styles.scss';

export default function StakingInfo() {
    const context = useWeb3React();
    const {chainId} = context;

    const isAdvancedStakingOpen = useAppSelector(
        isStakingOpenSelector(chainId!, StakeType.Advanced),
    );

    const stakeType = chainHasAdvancedStaking(chainId)
        ? StakeType.Advanced
        : StakeType.Classic;

    const allowedTill = useAppSelector(
        termsSelector(chainId!, stakeType, 'allowedTill'),
    );

    const lockedTill = useAppSelector(
        termsSelector(chainId!, stakeType, 'lockedTill'),
    );

    const minLockPeriod = useAppSelector(
        termsSelector(chainId!, stakeType, 'minLockPeriod'),
    );

    const getAdvancedStakingOpenText = useCallback((): {
        subtitle: string;
        body: ReactElement;
    } => {
        let subtitle = 'Advanced staking is open';
        if (allowedTill) {
            const allowedTillDate = formatTime(Number(allowedTill) * 1000);
            subtitle += ` till ${allowedTillDate}`;
        }
        const body = (
            <Typography>
                Advanced Staking will lock your tokens{' '}
                {lockedTill &&
                    `until ${formatTime(Number(lockedTill) * 1000)} `}
                and create zZKP as rewards in the Multi-Asset Shielded Pool
                (MASP). By staking your ZKP, you become one of the first people
                to create zAssets and contribute to bootstrapping and testing of
                the MASP.
            </Typography>
        );

        return {subtitle, body};
    }, [allowedTill, lockedTill]);

    const getAdvancedStakingClosedText = useCallback((): {
        subtitle: string;
        body: ReactElement;
    } => {
        return {
            subtitle: 'Advanced staking is closed for new stakes',
            body: (
                <>
                    <Typography>
                        The advanced staking rewards program ended
                        {allowedTill
                            ? ' on ' + formatTime(Number(allowedTill) * 1000)
                            : ''}
                        , so new stakes were automatically disabled by the smart
                        contracts.
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
                        , and there is no deadline for claiming rewards. However
                        active stakes have ceased to earn further rewards.
                    </p>
                </>
            ),
        };
    }, [allowedTill]);

    const getClassicStakingClosedText = useCallback((): {
        subtitle: string;
        body: ReactElement;
    } => {
        const link = (() => {
            switch (chainId) {
                case 1:
                case 4:
                    return 'https://docs.pantherprotocol.io/launchdao/voting-proposals/3-launch/staking';
                case 137:
                case 80001:
                    return 'https://docs.pantherprotocol.io/dao/governance/proposal-3-polygon-extension/staking';
                default:
                    return '';
            }
        })();

        console.debug('allowedTill: ', allowedTill);
        console.debug('minLockPeriod: ', minLockPeriod);
        const rewardsEnd =
            allowedTill &&
            minLockPeriod &&
            Number(allowedTill) + Number(minLockPeriod);

        return {
            subtitle: 'Classic staking is closed for new stakes',
            body: (
                <>
                    <Typography>
                        The classic staking rewards program ended
                        {rewardsEnd
                            ? ' on ' + formatTime(rewardsEnd * 1000)
                            : ''}
                        , so new stakes were automatically disabled by the smart
                        contracts
                        {allowedTill
                            ? ' on ' + formatTime(Number(allowedTill) * 1000)
                            : ''}
                        {link && (
                            <>
                                {' '}
                                as{' '}
                                <SafeMuiLink
                                    href={link}
                                    underline="always"
                                    color="inherit"
                                >
                                    previously scheduled
                                </SafeMuiLink>
                            </>
                        )}
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
                        , and there is no deadline for claiming rewards. However
                        active stakes have ceased to earn further rewards.
                    </p>
                    <p>
                        Also, advanced staking is now in public testing!{' '}
                        <SafeMuiLink
                            href="https://blog.pantherprotocol.io/incentivized-testing-for-zkp-advanced-staking-is-now-live-19b51bc6b42b"
                            underline="always"
                            color="inherit"
                        >
                            Read more
                        </SafeMuiLink>
                        .
                    </p>
                </>
            ),
        };
    }, [chainId, allowedTill, minLockPeriod]);

    const getAdvancedStakingText = useCallback((): {
        subtitle: string;
        body: ReactElement;
    } => {
        if (isAdvancedStakingOpen) {
            return getAdvancedStakingOpenText();
        }

        return getAdvancedStakingClosedText();
    }, [
        isAdvancedStakingOpen,
        getAdvancedStakingOpenText,
        getAdvancedStakingClosedText,
    ]);

    const {subtitle, body} = chainHasAdvancedStaking(chainId)
        ? getAdvancedStakingText()
        : getClassicStakingClosedText();

    return (
        <Card variant="outlined" className="staking-info-container">
            <CardContent className="staking-info-card-content">
                <Typography variant="subtitle2" className="staking-info-title">
                    {subtitle}
                </Typography>
                <div className="staking-info-text">{body}</div>
            </CardContent>
        </Card>
    );
}
