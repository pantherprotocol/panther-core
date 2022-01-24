import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import './styles.scss';
import Divider from '@mui/material/Divider';
import {Tooltip} from '@mui/material';

export const BalanceCard = (props: {
    rewardsBalance: string | null;
    tokenBalance: string | null;
    stakedBalance: string | null;
    tokenUSDValue: string | null;
}) => {
    return (
        <Card
            sx={{
                marginBottom: '20px',
                border: '1px solid #485267',
                backgroundColor: '#2B334140',
                borderRadius: '8px',
            }}
        >
            <Box display="flex" alignItems="baseline">
                <Typography
                    sx={{
                        fontWeight: 800,
                        fontStyle: 'normal',
                        fontSize: '18px',
                        lineHeight: '42px',
                        alignItems: 'left',
                    }}
                >
                    Total Balance
                </Typography>
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
                    {props.tokenBalance}
                </Typography>
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontSize: '16px',
                        lineHeight: '42px',
                        marginLeft: '8px',
                    }}
                >
                    ZKP
                </Typography>
            </Box>
            {props.tokenUSDValue && (
                <Box display="flex" alignItems="baseline">
                    <Typography
                        sx={{
                            fontWeight: 400,
                            fontStyle: 'normal',
                            fontSize: '12px',
                            lineHeight: '42px',
                            opacity: 0.5,
                        }}
                    >
                        Approximately ${props.tokenUSDValue}
                    </Typography>
                </Box>
            )}
            <Divider
                sx={{
                    margin: '18px 0',
                    backgroundColor: '#485267',
                }}
            />
            <Box display="flex" alignItems="baseline">
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontStyle: 'normal',
                        fontSize: '16px',
                        lineHeight: '42px',
                        marginRight: '4px',
                        opacity: 0.5,
                    }}
                >
                    Staked Balance
                </Typography>
                <Typography>
                    <Tooltip title="Staked ZKP Token Balance" placement="top">
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
                    {props.stakedBalance}
                </Typography>
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontSize: '16px',
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
                        fontWeight: 700,
                        fontStyle: 'normal',
                        fontSize: '16px',
                        lineHeight: '42px',
                        marginRight: '4px',
                        opacity: 0.5,
                    }}
                >
                    Unclaimed Reward Balance
                </Typography>
                <Typography>
                    <Tooltip
                        title="Unclaimed Reward ZKP Token Balance"
                        placement="top"
                    >
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
                    {props.rewardsBalance}
                </Typography>
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontSize: '16px',
                        lineHeight: '42px',
                        marginLeft: '8px',
                    }}
                >
                    ZKP
                </Typography>
            </Box>
        </Card>
    );
};

export const PrivateStakingComingSoonCard = () => {
    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: '10px',
                border: '1px solid #485267',
                background: '#2B334140',
            }}
        >
            <Box display="flex" alignItems="baseline">
                <Typography
                    sx={{
                        fontWeight: 800,
                        fontStyle: 'normal',
                        fontSize: '18px',
                        lineHeight: '42px',
                        alignItems: 'left',
                    }}
                >
                    Advanced Staking Coming Soon
                </Typography>
            </Box>
            <Box display="flex" alignItems="baseline">
                <Typography
                    sx={{
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '22px',
                        opacity: 0.5,
                        marginBottom: '18px',
                        textAlign: 'left',
                    }}
                >
                    Advanced incentivized ZKP private staking with a higher APY
                    is coming soon!
                </Typography>
            </Box>
        </Card>
    );
};

export default function OutlinedCard(props: {
    rewardsBalance: string | null;
    tokenBalance: string | null;
    stakedBalance: string | null;
    tokenUSDValue: string | null;
}) {
    return (
        <Box width={'100%'} margin={'0 5'}>
            <BalanceCard
                tokenBalance={props.tokenBalance}
                tokenUSDValue={props.tokenUSDValue}
                stakedBalance={props.stakedBalance}
                rewardsBalance={props.rewardsBalance}
            />
            <PrivateStakingComingSoonCard />
        </Box>
    );
}
