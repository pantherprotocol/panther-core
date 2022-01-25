import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {Link, Tooltip} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import React from 'react';
import './styles.scss';

const CurrentStakeAPY = (props: {currentAPY: string}) => {
    return (
        <Box
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
                        <ErrorOutlineIcon
                            fontSize="small"
                            sx={{
                                marginTop: '5px',
                                marginRight: '10px',
                                color: '#687692',
                            }}
                        />
                    </Tooltip>
                </Box>
                <Typography
                    variant="caption"
                    color={'#FFDFBD'}
                    fontSize={'32px'}
                    fontWeight={800}
                >
                    {props.currentAPY || '47.9%'}
                </Typography>
                <Typography
                    variant="caption"
                    color={'#FFFFFF'}
                    fontSize={'16px'}
                    fontWeight={500}
                >
                    Current Staking APY
                </Typography>
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
                    on Panther DAO proposals.
                    <Link href="#" underline="always" color="inherit">
                        Learn more.
                    </Link>
                </Typography>
            </Box>
        </Box>
    );
};

export default CurrentStakeAPY;
