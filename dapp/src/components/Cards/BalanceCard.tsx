import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Stack from '@mui/material/Stack';
import './styles.scss';
import Divider from '@mui/material/Divider';

const BalanceCard = () => (
    <Card
        // variant="outlined"
        sx={{
            // borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #485267',

            backgroundColor: '#2B334140',
            borderRadius: '8px',

        }}
    >
        <Box display="flex" alignItems="baseline">
            <Typography
                sx={{
                    fontFamily: 'inner',
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
                    fontFamily: 'inner',
                    fontWeight: 800,
                    fontStyle: 'bold',
                    fontSize: '32px',
                    lineHeight: '42px',
                }}
            >
                42,458
            </Typography>

            <Typography
                sx={{
                    fontFamily: 'inner',
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
                    fontFamily: 'inner',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '12px',
                    lineHeight: '42px',
                    opacity: 0.5,
                    marginBottom: '18px',
                }}
            >
                Approximately $73,070.21
            </Typography>
        </Box>
        <Stack spacing={2} direction="row">
            <Button
                variant="contained"
                sx={{
                    textTransform: 'capitalize',
                    minWidth: '150px',
                }}
            >
                Deposit
            </Button>
            <Button
                variant="outlined"
                sx={{
                    color: '#fff',
                    textTransform: 'capitalize',
                    minWidth: '150px',
                }}
            >
                Withdraw
            </Button>
        </Stack>
        <Divider
            sx={{
                margin: '18px 0',
                backgroundColor: '#485267',
            }}
        />

        <Box display="flex" alignItems="baseline">
            <Typography
                sx={{
                    fontFamily: 'inner',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '42px',
                    opacity: 0.5,
                    marginRight: '18px',
                }}

            >
                Staked Balance
            </Typography>
            <Typography>
                <ErrorOutlineIcon fontSize="small" className="error-outline"
                    sx={{
                        opacity: 0.5,

                    }}
                />
            </Typography>
        </Box>

        <Box display="flex" alignItems="baseline">
            <Typography
                component="div"
                sx={{
                    fontFamily: 'inner',
                    fontWeight: 800,
                    fontStyle: 'bold',
                    fontSize: '22px',
                    lineHeight: '42px',
                }}
            >
                25,000
            </Typography>

            <Typography
                sx={{
                    fontFamily: 'inner',
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
                    fontFamily: 'inner',
                    fontWeight: 700,
                    fontStyle: 'normal',
                    fontSize: '16px',
                    lineHeight: '42px',
                    marginRight: '18px',
                    opacity: 0.5,

                }}
            >
                Unclaim Reward balance
            </Typography>
            <Typography>
                <ErrorOutlineIcon fontSize="small" className="error-outline"

                    sx={{
                        opacity: 0.5,

                    }}
                />
            </Typography>
        </Box>

        <Box display="flex" alignItems="baseline">
            <Typography
                component="div"
                sx={{
                    fontFamily: 'inner',
                    fontWeight: 800,
                    fontStyle: 'bold',
                    fontSize: '22px',
                    lineHeight: '42px',
                }}
            >
                870.90
            </Typography>

            <Typography
                sx={{
                    fontFamily: 'inner',
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
    </Card>
);

const PrivateStakingComingSoonCard = () => (
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
                    fontFamily: 'inner',
                    fontWeight: 800,
                    fontStyle: 'normal',
                    fontSize: '18px',
                    lineHeight: '42px',
                    alignItems: 'left',
                }}
            >
                Private Staking Coming Soon
            </Typography>
        </Box>

        <Box display="flex" alignItems="baseline">
            <Typography
                sx={{
                    fontFamily: 'inner',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '22px',
                    opacity: 0.5,
                    marginBottom: '18px',
                    textAlign: 'left'
                }}
            >
                Advance incetivized ZKP private staking is coming in March.
            </Typography>
        </Box>
    </Card>
);

export default function OutlinedCard() {
    return (
        <Box width={'100%'} margin={'0 5'}
            sx={{
                //    justifyContent:'space-between'
            }}
        >
            {/* <Card variant="outlined"> */}
            <BalanceCard />
            <PrivateStakingComingSoonCard />
            {/* </Card> */}
        </Box>
    );
}
