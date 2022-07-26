import React from 'react';

import {Box, Button, Typography} from '@mui/material';

import {formatTime} from '../../../lib/format';
import {chainHasAdvancedStaking} from '../../../services/contracts';

import './styles.scss';

const UnstakeButton = (props: {
    row: any;
    chainId: number | undefined;
    unstakeById: (id: any) => Promise<void>;
}) => {
    const {row, chainId, unstakeById} = props;
    return (
        <Button
            className={`unstake-button ${!row.unstakable ? 'locked' : ''}`}
            disabled={chainHasAdvancedStaking(chainId) ? !row.unstakable : true}
            onClick={() => {
                unstakeById(row.id);
            }}
        >
            {row.unstakable ? (
                'Unstake'
            ) : (
                <Box>
                    <Typography>Locked Until:</Typography>
                    <Typography>{formatTime(row.lockedTill * 1000)}</Typography>
                </Box>
            )}
        </Button>
    );
};
export default UnstakeButton;
