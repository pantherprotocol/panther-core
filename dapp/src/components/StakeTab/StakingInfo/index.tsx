import React, {ReactElement, useCallback} from 'react';

import {Typography, Card, CardContent} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {SafeMuiLink} from 'components/Common/links';
import {add, format} from 'date-fns';
import warningIcon from 'images/warning-icon-triangle.svg';
import {formatTime, secondsToFullDays} from 'lib/format';
import {useAppSelector} from 'redux/hooks';
import {
    isStakingOpenSelector,
    isStakingPostCloseSelector,
    termsSelector,
} from 'redux/slices/staking/stake-terms';
import {chainHasAdvancedStaking} from 'services/contracts';
import {StakeType} from 'types/staking';

import './styles.scss';

export default function StakingInfo() {
    const context = useWeb3React();
    const {chainId} = context;

    const isAdvancedStakingOpen = useAppSelector(
        isStakingOpenSelector(chainId!, StakeType.Advanced),
    );

    const isAdvancedStakingPostClose = useAppSelector(
        isStakingPostCloseSelector(chainId!, StakeType.Advanced),
    );

    const stakeType = chainHasAdvancedStaking(chainId)
        ? StakeType.Advanced
        : StakeType.Classic;

    const allowedSince = useAppSelector(
        termsSelector(chainId!, stakeType, 'allowedSince'),
    );

    const allowedTill = useAppSelector(
        termsSelector(chainId!, stakeType, 'allowedTill'),
    );

    const minLockPeriod = useAppSelector(
        termsSelector(chainId!, stakeType, 'minLockPeriod'),
    );

    const getAdvancedStakingPreCloseText = useCallback((): {
        subtitle: string;
        body: ReactElement;
    } => {
        let subtitle = 'Advanced staking ';

        if (isAdvancedStakingOpen) {
            if (minLockPeriod) {
                const unlockDate = add(new Date(), {
                    seconds: Number(minLockPeriod),
                });
                subtitle += `will lock your tokens until ${format(
                    unlockDate,
                    'dd MMM yyyy',
                )}`;
            } else {
                subtitle += 'is now open';
            }
        } else {
            subtitle += 'will open';
            if (allowedSince) {
                const allowedSinceDate = new Date(Number(allowedSince) * 1000);
                subtitle += ' on ' + format(allowedSinceDate, 'dd MMM yyyy');
            } else {
                subtitle += ' soon!';
            }
        }

        const body = (
            <>
                <p className="staking-info-text-paragraph">
                    You will need to unstake in order for your staked assets to
                    be liquid again. Rewards are earned automatically.{' '}
                    <span className="learn-more-link">Learn more.</span>
                </p>
                <p>
                    Your staked ZKP will create zZKP as rewards in the
                    Multi-Asset Shielded Pool. By staking your ZKP, you become
                    one of the first users to create zAssets and contribute to
                    the bootstrapping of the MASP.
                </p>
            </>
        );

        return {subtitle, body};
    }, [isAdvancedStakingOpen, minLockPeriod, allowedSince]);

    const getAdvancedStakingClosedText = useCallback((): {
        subtitle: string;
        body: ReactElement;
    } => {
        return {
            subtitle: 'Advanced staking is closed for new stakes',
            body: (
                <>
                    <p>
                        The advanced staking rewards program ended
                        {allowedTill
                            ? ' on ' + formatTime(Number(allowedTill) * 1000)
                            : ''}
                        , so new stakes were automatically disabled by the smart
                        contracts.
                    </p>
                    <p>
                        Advanced stakes are locked
                        {minLockPeriod && minLockPeriod > 0
                            ? ` for ${secondsToFullDays(
                                  minLockPeriod as number,
                              )} days upon staking`
                            : ' until the fixed date defined for each stake'}
                        . However, Classic stakes can be unstaked{' '}
                        <SafeMuiLink
                            href="https://docs.pantherprotocol.io/dao/support/faq/staking#when-unstake"
                            underline="always"
                            color="inherit"
                            styles="strong-subtext"
                        >
                            at any time
                        </SafeMuiLink>
                        . There is no deadline for claiming rewards for either
                        program.
                    </p>
                </>
            ),
        };
    }, [allowedTill, minLockPeriod]);

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
                    <p>
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
                    </p>
                    <p>
                        You can still unstake{' '}
                        <SafeMuiLink
                            href="https://docs.pantherprotocol.io/dao/support/faq/staking#when-unstake"
                            underline="always"
                            color="inherit"
                        >
                            classic stakes at any time
                        </SafeMuiLink>
                        , and there is no deadline for claiming rewards.
                    </p>
                    <p>
                        <strong>
                            However, advanced staking is now in public testing
                            on the Mumbai network!
                        </strong>{' '}
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
        if (isAdvancedStakingPostClose) {
            return getAdvancedStakingClosedText();
        }

        return getAdvancedStakingPreCloseText();
    }, [
        isAdvancedStakingPostClose,
        getAdvancedStakingPreCloseText,
        getAdvancedStakingClosedText,
    ]);

    const getDisconnectedText = useCallback((): {
        subtitle: string;
        body: ReactElement;
    } => {
        return {
            subtitle: 'Connect your wallet',
            body: (
                <>
                    <p>
                        Advanced staking is now in progress. Connect your wallet
                        to find out more!
                    </p>
                </>
            ),
        };
    }, []);

    const {subtitle, body} = chainId
        ? chainHasAdvancedStaking(chainId)
            ? getAdvancedStakingText()
            : getClassicStakingClosedText()
        : getDisconnectedText();

    return (
        <Card variant="outlined" className="staking-info-container">
            <CardContent className="staking-info-card-content">
                <Typography
                    variant="subtitle2"
                    className="staking-info-title-wrapper"
                >
                    <img
                        src={warningIcon}
                        alt="warning-icon"
                        className="warning-icon"
                    />{' '}
                    <span className="stake-info-title">{subtitle}</span>
                </Typography>
                <div className="stake-info-text">{body}</div>
            </CardContent>
        </Card>
    );
}
