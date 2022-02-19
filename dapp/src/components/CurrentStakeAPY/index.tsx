import React from 'react';

import {IconButton, Tooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import infoIcon from '../../images/info-icon.svg';
import {SafeMuiLink} from '../../services/links';
import {formatPercentage} from '../../utils';

import './styles.scss';

const CurrentStakeAPY = (props: {currentAPY: number | null}) => {
    return (
        <Box className="current-stake-apy-container">
            {typeof props.currentAPY === 'number' && (
                <Box className="current-stake-apy-inner">
                    <Typography>
                        <Tooltip
                            title={
                                'Current APY based on total $ZKP currently staked. This will reduce as more people stake.'
                            }
                            data-html="true"
                            placement="top"
                            className="icon"
                        >
                            <IconButton size="small">
                                <img src={infoIcon} />
                            </IconButton>
                        </Tooltip>
                    </Typography>

                    <Typography className="apy-amount">
                        {formatPercentage(props.currentAPY) || '??'}
                    </Typography>
                    <Typography className="apy-title">
                        Current staking APY
                    </Typography>
                </Box>
            )}
            {typeof props.currentAPY !== 'number' && (
                <Box className="current-stake-apy-inner">
                    <Typography className="message-title">
                        Connect wallet
                        <br />
                        to see APY
                    </Typography>
                </Box>
            )}

            <Box className="current-stake-apy-text">
                <Typography className="message-title">
                    Earn rewards for staking ZKP
                </Typography>
                <Typography className="message-text">
                    Along with earning from a 6.65million $ZKP staking rewards
                    pool, staking also gives you voting rights on Panther DAO
                    proposals.{' '}
                    <SafeMuiLink
                        href="https://docs.pantherprotocol.io/panther-dao-and-zkp/the-zkp-token/staking"
                        underline="always"
                        color="inherit"
                    >
                        Learn more
                    </SafeMuiLink>
                </Typography>
            </Box>
        </Box>
    );
};

export default CurrentStakeAPY;
