import React, {ReactElement, useCallback} from 'react';

import {Typography, Card, CardContent} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import {formatTime} from '../../../lib/format';
import {useAppSelector} from '../../../redux/hooks';
import {
    isStakingOpenSelector,
    isStakingPostCloseSelector,
    termsSelector,
} from '../../../redux/slices/stakeTerms';
import {chainHasAdvancedStaking} from '../../../services/contracts';
import {StakeType} from '../../../types/staking';
import {SafeMuiLink} from '../../Common/links';

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
        let subtitle =
            'Advanced staking ' +
            (isAdvancedStakingOpen ? 'is open!' : 'will open');
        if (!isAdvancedStakingOpen) {
            if (allowedSince) {
                const allowedSinceDate = formatTime(
                    Number(allowedSince) * 1000,
                );
                subtitle += isAdvancedStakingOpen ? ' since' : ' on';
                subtitle += ' ' + allowedSinceDate;
            } else {
                subtitle += isAdvancedStakingOpen ? '!' : ' soon!';
            }
        }

        const allowedTillDate =
            allowedTill && formatTime(Number(allowedTill) * 1000);
        const body = (
            <Typography>
                Advanced Staking will{' '}
                {allowedTill && `be open until ${allowedTillDate} and will `}
                lock your tokens
                {minLockPeriod && minLockPeriod > 0
                    ? ` for ${Math.floor(
                          (minLockPeriod as number) / 3600 / 24,
                      )} days and `
                    : ', and '}
                create zZKP as rewards in the Multi-Asset Shielded Pool (MASP).
                By staking your ZKP, you become one of the first people to
                create zAssets and contribute to bootstrapping and testing of
                the MASP.
            </Typography>
        );

        return {subtitle, body};
    }, [isAdvancedStakingOpen, allowedSince, allowedTill, minLockPeriod]);

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
                        Advanced stakes are locked
                        {minLockPeriod && minLockPeriod > 0
                            ? ` for ${Math.floor(
                                  (minLockPeriod as number) / 3600 / 24,
                              )} days`
                            : ' until the fixed date defined for each stake'}
                        ; however classic stakes can be unstaked{' '}
                        <SafeMuiLink
                            href="https://docs.pantherprotocol.io/dao/support/faq/staking#when-unstake"
                            underline="always"
                            color="inherit"
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
                    <Typography>
                        Advanced staking is now in progress. Connect your wallet
                        to find out more!
                    </Typography>
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
                <Typography variant="subtitle2" className="staking-info-title">
                    {subtitle}
                </Typography>
                <div className="staking-info-text">{body}</div>
            </CardContent>
        </Card>
    );
}
