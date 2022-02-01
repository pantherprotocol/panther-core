import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {IconButton, Tooltip} from '@mui/material';

import {SafeMuiLink} from '../../services/links';
import infoIcon from '../../images/info-icon.svg';

import './styles.scss';

const CurrentStakeAPY = (props: {currentAPY: string}) => {
    return (
        <Box className="current-stake-apy-container">
            <Box className="current-stake-apy-inner">
                <Typography>
                    <Tooltip
                        title={
                            'Indicative forecast for first 30 days assuming 50% of eligible token supply staked. More accurate figures will be provided when staking stabilises.'
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
                    {props.currentAPY || '46.98%'}
                </Typography>
                <Typography className="apy-title">
                    Indicative initial APY
                </Typography>
            </Box>

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
