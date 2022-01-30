import * as React from 'react';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import './styles.scss';

const AdvancedStakingComingSoon = () => {
    return (
        <Card className="advanced-staking-comming-soon-card" variant="outlined">
            <Typography className="card-title">
                Advanced Staking Coming Soon
            </Typography>
            <Typography className="card-text">
                Advanced incentivized ZKP private staking with a higher APY is
                coming soon!
            </Typography>
        </Card>
    );
};

export default AdvancedStakingComingSoon;
