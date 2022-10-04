import {useState} from 'react';
import * as React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import StakeTab from '../StakeTab';
import UnstakingTab from '../UnstakeTab';

import './styles.scss';

const StakingUnstakingCard = () => {
    const [toggle, setToggle] = useState('stake');

    const handleChange = (
        _event: React.MouseEvent<HTMLElement>,
        newState: string,
    ) => {
        if (newState !== null) {
            setToggle(newState);
        }
    };

    const children = [
        <ToggleButton value="stake" key="1">
            Stake ZKP
        </ToggleButton>,
        <ToggleButton value="unstake" key="2">
            Unstake ZKP
        </ToggleButton>,
    ];

    const control = {
        value: toggle,
        onChange: handleChange,
        exclusive: true,
    };

    return (
        <Box
            className="advanced-balance-card-holder"
            data-testid="staking-unstaking-card_wrapper"
        >
            <Card className="advanced-balance-card">
                <Box>
                    <ToggleButtonGroup size="large" {...control}>
                        {children}
                    </ToggleButtonGroup>
                </Box>

                <CardContent>
                    {toggle == 'stake' || toggle == null ? (
                        <StakeTab />
                    ) : (
                        <UnstakingTab />
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default StakingUnstakingCard;
