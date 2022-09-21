import React from 'react';

import {Box, Typography} from '@mui/material';

import governanceIcon from '../../images/governance-icon.svg';
import privacyIcon from '../../images/privacy-icon.svg';
import rewardsIcon from '../../images/rewards-icon.svg';

type Featuretype = {
    title: string;
    message: string;
    icon: string;
};

export const featuredata: Featuretype[] = [
    {
        title: 'Privacy',
        message: "Test Panther's privacy features in a real-world environment.",
        icon: privacyIcon,
    },
    {
        title: 'Rewards',
        message: 'Earn rewards proportional to the size of your $ZKP stake.',
        icon: rewardsIcon,
    },
    {
        title: 'Governance ',
        message: 'Vote on DAO proposals to implement protocol changes.',
        icon: governanceIcon,
    },
];

function Feature(props: {feature: Featuretype}) {
    return (
        <Box className="welcome-feature">
            <Box className="welcome-feature-icon">
                <img src={props.feature.icon} />
            </Box>
            <Typography className="welcome-feature-title">
                {props.feature.title}
            </Typography>
            <Typography className="welcome-feature-message">
                {props.feature.message}
            </Typography>
        </Box>
    );
}

export default Feature;
