import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import {Tooltip} from '@mui/material';
import Address from '../Address';
import accountAvatar from '../../images/account-avatar.png';
import './styles.scss';

const BalanceCard = (props: {
    rewardsBalance: string | null;
    tokenBalance: string | null;
    stakedBalance: string | null;
    tokenUSDValue: string | null;
    accountAddress: string | null;
}) => {
    return (
        <>
            <Card
                sx={{
                    marginBottom: '20px',
                    border: '1px solid #485267',
                    backgroundColor: '#2B334140',
                    borderRadius: '8px',
                }}
            >
                <AddressWithSetting
                    accountAvatar={accountAvatar}
                    accountAddress={props.accountAddress}
                />

                <TotalBalance
                    title={'Total Balance'}
                    tokenBalance={props.tokenBalance}
                    tokenMarketPrice={props.tokenUSDValue}
                />

                <AddressBalances
                    title={'Staked Balance'}
                    balance={props.stakedBalance}
                    amountUSD={props.tokenUSDValue}
                />

                <AddressBalances
                    title={'Unclaimed Reward balance'}
                    balance={props.rewardsBalance}
                    amountUSD={props.tokenUSDValue}
                />
            </Card>
        </>
    );
};

const AddressWithSetting = (props: {
    accountAvatar: string;
    accountAddress: string | null;
}) => {
    return (
        <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            marginBottom={'10px'}
        >
            <Box
                width={'50%'}
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Address
                    accountAvatar={props.accountAvatar}
                    accountAddress={props.accountAddress}
                />
            </Box>
            <Box
                width={'50%'}
                display="flex"
                alignItems="center"
                justifyContent="end"
            >
                <SettingsIcon
                    sx={{
                        opacity: 0.5,
                    }}
                />
            </Box>
        </Box>
    );
};

const TotalBalance = ({title, tokenBalance, tokenMarketPrice}) => {
    return (
        <Box
            sx={{
                background: '#63728835',
                borderRadius: '8px',
                padding: '0 15px',
                mixBlendMode: 'normal',
            }}
        >
            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
            >
                <Typography
                    sx={{
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '42px',
                        marginRight: '18px',
                    }}
                >
                    {title}
                </Typography>
                <RefreshIcon
                    sx={{
                        opacity: 0.5,
                        transform: 'rotate(180deg)',
                    }}
                />
            </Box>

            <Box display="flex" alignItems="baseline">
                <Typography
                    component="div"
                    sx={{
                        fontWeight: 800,
                        fontStyle: 'bold',
                        fontSize: '32px',
                        lineHeight: '42px',
                    }}
                >
                    {tokenBalance || '41,458.'}
                    <span style={{fontSize: '24px'}}>45</span>
                </Typography>
                <Typography
                    sx={{
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '12px',
                        lineHeight: '42px',
                        marginLeft: '8px',
                    }}
                >
                    ZKP
                </Typography>
            </Box>
            <Box display="flex" alignItems="baseline">
                <Typography
                    sx={{
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '42px',
                        opacity: 0.5,
                        marginRight: '18px',
                    }}
                >
                    {'~$73.070 USD'}
                </Typography>
            </Box>
            {tokenMarketPrice && (
                <Box display="flex" alignItems="baseline">
                    <Typography
                        sx={{
                            fontWeight: 400,
                            fontStyle: 'normal',
                            fontSize: '12px',
                            lineHeight: '42px',
                            opacity: 0.5,
                            marginBottom: '18px',
                        }}
                    >
                        Approximately ${tokenMarketPrice}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

const AddressBalances = props => {
    const {title, amountUSD, balance} = props;
    return (
        <>
            <Box display="flex" alignItems="baseline">
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontStyle: 'normal',
                        fontSize: '16px',
                        lineHeight: '42px',
                        marginRight: '18px',
                        opacity: 0.5,
                    }}
                >
                    {title}
                </Typography>
                <Typography>
                    <Tooltip title={title} placement="top">
                        <ErrorOutlineIcon
                            fontSize="small"
                            className="error-outline"
                            sx={{
                                opacity: 0.5,
                            }}
                        />
                    </Tooltip>
                </Typography>
            </Box>
            <Box display="flex" justifyContent={'space-between'}>
                <Box display="flex" justifyContent={'center'}>
                    <Typography
                        component="div"
                        sx={{
                            fontWeight: 800,
                            fontStyle: 'bold',
                            fontSize: '22px',
                            lineHeight: '42px',
                        }}
                    >
                        {balance || '38,070'}
                    </Typography>
                    <Typography
                        sx={{
                            fontWeight: 400,
                            fontStyle: 'normal',
                            fontSize: '12px',
                            lineHeight: '42px',
                            marginLeft: '8px',
                        }}
                    >
                        ZKP
                    </Typography>
                </Box>
                <Typography
                    sx={{
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '12px',
                        lineHeight: '42px',
                        marginLeft: '8px',
                    }}
                >
                    {amountUSD}
                </Typography>
            </Box>
        </>
    );
};

export default BalanceCard;
