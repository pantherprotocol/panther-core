import React from 'react';

import {Box, Card, CardContent, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import './styles.scss';

export default function UnstakingInfo() {
    const {chainId} = useWeb3React();

    if (chainId === 1) {
        return (
            <Card variant="outlined" className="unstaking-info-container">
                <CardContent className="unstaking-info-card-content">
                    <Typography
                        variant="subtitle2"
                        className="unstaking-info-title"
                    >
                        All rewards are now redeemed on first unstake
                    </Typography>
                    <Typography className="unstaking-info-text">
                        As part of the fix for the unstaking bug on Ethereum
                        mainnet, the mechanism for claiming rewards has changed
                        slightly:
                    </Typography>
                    <Typography className="unstaking-info-text">
                        If you have multiple stakes on mainnet, you will receive{' '}
                        <strong>all</strong> of your rewards on the first
                        unstake. Any subsequent unstake will return the staked
                        amount, but no further rewards, since you will have
                        already received all the rewards.
                    </Typography>
                    <Typography className="unstaking-info-text">
                        <strong>
                            The amount of rewards you will receive is (of
                            course!) not changed in any way,
                        </strong>{' '}
                        only <em>when</em> you receive them. If you only have
                        one stake, this change will not affect you at all.
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
