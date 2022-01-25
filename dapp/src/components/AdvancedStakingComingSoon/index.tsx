import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import './styles.scss';

const AdvancedStakingComingSoon = () => {
    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: '10px',
                border: '1px solid #485267',
                background: '#63728835',
            }}
        >
            <Box display="flex" alignItems="baseline">
                <Typography
                    sx={{
                        fontWeight: 800,
                        fontStyle: 'normal',
                        fontSize: '18px',
                        lineHeight: '42px',
                        textAlign: 'left',
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

export default AdvancedStakingComingSoon;
