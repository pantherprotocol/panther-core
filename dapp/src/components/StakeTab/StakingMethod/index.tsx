// Reintroduce when advanced staking is supported.

import React from 'react';

import {Box, MenuItem, Select, Typography} from '@mui/material';

import './styles.scss';

export default function StakingMethod(props: {
    stakeType: string;
    setStakeType: (type: string) => void;
}) {
    return (
        <Box className="staking-method-container">
            <Box
                display="flex"
                justifyContent={'space-between'}
                alignItems={'center'}
            >
                <Typography className="staking-method-title">
                    Staking Method:
                </Typography>
                <Select
                    labelId="staking-method-select-label"
                    id="staking-method-selectd"
                    variant="standard"
                    value={props.stakeType}
                    className="staking-method-select"
                    onChange={e => {
                        props.setStakeType(e.target.value);
                    }}
                >
                    <MenuItem selected value={'classic'}>
                        Standard
                    </MenuItem>
                    <MenuItem value={'advanced'}>Advanced</MenuItem>
                </Select>
            </Box>
        </Box>
    );
}
