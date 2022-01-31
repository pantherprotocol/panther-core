import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {IconButton, Tooltip} from '@mui/material';

import {SafeMuiLink} from '../../services/links';
import infoIcon from '../../images/info-icon.svg';

import './styles.scss';

const CurrentStakeAPY = (props: {currentAPY: string}) => {
    return (
        <Box
            className="current-stake-apy-container"
            display={'flex'}
            justifyContent={'space-between'}
            alignItems={'center'}
            sx={{
                padding: '1rem 1rem',
                border: '1px solid #384258',
                borderRadius: '10px',
                height: '130px',
                marginBottom: '1.5rem',
            }}
        >
            <Box
                className="current-stake-apy-inner"
                width={'35%'}
                display={'flex'}
                flexDirection={'column'}
                justifyContent={'center'}
                alignItems={'center'}
                sx={{
                    borderRadius: '8px',
                    background: '#3F4A5F',
                }}
            >
                <Box
                    display={'flex'}
                    justifyContent={'end'}
                    alignItems={'center'}
                    width={'100%'}
                >
                    <Tooltip title={'Current APY'} placement="top">
                        <IconButton
                            sx={{
                                opacity: 0.6,
                            }}
                        >
                            <img src={infoIcon} />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Box>
                    <Typography
                        variant="body1"
                        color={'#FFDFBD'}
                        fontSize={'32px'}
                        fontWeight={800}
                    >
                        {props.currentAPY || '47.9%'}
                    </Typography>
                    <Typography
                        variant="body1"
                        color={'#FFFFFF'}
                        fontSize={'16px'}
                        fontWeight={500}
                    >
                        Current Staking APY
                    </Typography>
                </Box>
            </Box>
            <Box
                display={'flex'}
                flexDirection={'column'}
                justifyContent={'center'}
                alignItems={'center'}
                width={'65%'}
                paddingLeft={'15px'}
                sx={{
                    textAlign: 'start',
                }}
            >
                <Typography color={'#FFFFFF'} fontWeight={700} width={'100%'}>
                    Earn more rewards for staking ZKP
                </Typography>
                <Typography
                    variant="caption"
                    color={'#FFFFFF'}
                    fontSize={'13px'}
                    fontWeight={400}
                    width={'100%'}
                    sx={{
                        opacity: '0.9',
                    }}
                >
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
