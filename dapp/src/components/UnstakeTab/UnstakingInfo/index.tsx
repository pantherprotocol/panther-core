import React from 'react';

import {Box, Card, CardContent, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import {chainHasAdvancedStaking} from '../../../services/contracts';

import './styles.scss';

export default function UnstakingInfo() {
    const {chainId} = useWeb3React();

    if (chainId === 1 && !chainHasAdvancedStaking(chainId)) {
        return (
            <Card variant="outlined" className="unstaking-info-container">
                <CardContent className="unstaking-info-card-content">
                    <Typography
                        variant="subtitle2"
                        className="unstaking-info-title"
                    >
                        Unstaking is temporarily disabled due to a bug
                    </Typography>
                    <Typography className="unstaking-info-text">
                        We have discovered a bug in the unstaking process on
                        Ethereum.{' '}
                        <strong>
                            Rest assured all funds are safe and no rewards will
                            be lost!
                        </strong>{' '}
                        The Panther team is working hard on a fix.
                    </Typography>
                    <Typography className="unstaking-info-text">
                        In the meantime, unstaking has been temporarily disabled
                        in this app, to protect users from wasting gas on
                        unstaking transactions which would fail.
                    </Typography>
                    <Typography className="unstaking-info-text">
                        Further communications will be provided soon. Many
                        apologies for the inconvenience.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Box className="unstaking-info-message">
            <Typography variant="caption">
                Stake transactions must be staking for 7+ day to be eligible to
                unstake. Rewards are claimed once a transaction is unstaked.
            </Typography>
        </Box>
    );
}
