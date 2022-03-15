import * as React from 'react';

import {Box, Button} from '@mui/material';
import {BigNumber, utils} from 'ethers';

import './styles.scss';

// Minimum stake is fixed in classic staking terms; no need for a contract call.
const MINIMUM_STAKE = utils.parseUnits('100');

const getButtonText = (
    amount: string | null,
    amountBN: BigNumber | null,
    tokenBalance: BigNumber | null,
): [string, boolean] => {
    if (!tokenBalance) {
        return ["Couldn't get token balance", false];
    }
    if (!amount || !amountBN) {
        return ['Enter amount to stake above', false];
    }
    if (amountBN.gt(tokenBalance)) {
        console.debug(
            'Insufficient balance:',
            utils.formatEther(amountBN),
            '>',
            utils.formatEther(tokenBalance),
        );
        return ['Insufficient balance', false];
    }
    if (amountBN.gte(MINIMUM_STAKE)) {
        console.debug(
            'Sufficient balance:',
            utils.formatEther(amountBN),
            amountBN.eq(tokenBalance) ? '==' : '<=',
            utils.formatEther(tokenBalance),
        );
        // We display amount rather than stringifying amountBN, because we want
        // to make sure we display the same amount which is visible in the
        // staking amount field, and this is not guaranteed to be the same
        // due to rounding discrepancies, e.g. if Max button is clicked.
        return [`STAKE ${amount} ZKP`, true];
    }
    console.debug('Below minimum stake amount:', utils.formatEther(amountBN));
    return ['Stake amount must be above 100', false];
};

const StakingBtn = (props: {
    amountToStake: string | null;
    amountToStakeBN: BigNumber | null;
    tokenBalance: BigNumber | null;
    stake: (amount: BigNumber) => Promise<void>;
}) => {
    const [buttonText, ready] = getButtonText(
        props.amountToStake,
        props.amountToStakeBN,
        props.tokenBalance,
    );
    const activeClass = ready ? 'active' : '';

    return (
        <Box className={`buttons-holder ${activeClass}`}>
            <Button
                className="staking-button"
                onClick={() => {
                    if (ready && props.amountToStakeBN) {
                        props.stake(props.amountToStakeBN);
                    }
                }}
            >
                {buttonText}
            </Button>
        </Box>
    );
};

export default StakingBtn;
