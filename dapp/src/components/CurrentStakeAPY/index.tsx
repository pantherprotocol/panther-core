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
                        title={'Current APY'}
                        placement="top"
                        className="icon"
                    >
                        <IconButton size="small">
                            <img src={infoIcon} />
                        </IconButton>
                    </Tooltip>
                </Typography>

                <Typography className="apy-amount">
                    {props.currentAPY || '47.9%'}
                </Typography>
                <Typography className="apy-title">
                    Current Staking APY
                </Typography>
            </Box>

            <Box className="current-stake-apy-text">
                <Typography className="message-title">
                    Earn more rewards for staking ZKP
                </Typography>
                <Typography className="message-text">
                    Along with earning rewards, staking also allows you to vote
                    on Panther DAO proposals.{' '}
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
