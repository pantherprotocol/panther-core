import * as React from 'react';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import {SafeLink} from '../../services/links';

import './styles.scss';

const AdvancedStakingComingSoon = () => {
    return (
        <Card className="advanced-staking-comming-soon-card" variant="outlined">
            <Typography className="card-title">
                Advanced staking is on the way!
            </Typography>
            <Typography className="card-text">
                Now that the initial staking program is underway, the team is
                working on advanced incentivized private staking with a higher
                APY.
            </Typography>
            <Typography className="card-text">
                This will showcase the first elements of the full protocol
                involving zAssets and cross-chain interoperability.{' '}
                <SafeLink href="https://blog.pantherprotocol.io/zkp-staking-will-be-available-this-wednesday-c73c7c98b5f2">
                    Learn&nbsp;more
                </SafeLink>
            </Typography>
        </Card>
    );
};

export default AdvancedStakingComingSoon;
