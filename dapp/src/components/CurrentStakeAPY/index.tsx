import React, {useCallback} from 'react';

import {BigNumber} from '@ethersproject/bignumber';
import {IconButton, Tooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {useWeb3React} from '@web3-react/core';
import {constants} from 'ethers';

import infoIcon from '../../images/info-icon.svg';
import {useAppSelector} from '../../redux/hooks';
import {totalStakedSelector} from '../../redux/slices/totalStaked';
import {chainVar} from '../../services/env';
import {E18} from '../../utils/constants';
import {formatCurrency, formatPercentage} from '../../utils/helpers';
import {SafeMuiLink} from '../Common/links';

import './styles.scss';

const getAPY = (totalStaked: BigNumber | null, chainId: number | undefined) => {
    if (!chainId || !totalStaked) return null;
    console.log('Total ZKP staked:', formatCurrency(totalStaked));

    const rewardsAvailable = chainVar('REWARD_POOL_SIZE', chainId);
    const rewardsAvailableBN = BigNumber.from(rewardsAvailable).mul(E18);
    const programDays = chainVar('STAKING_PROGRAM_DURATION', chainId);
    if (!programDays) return;

    console.log(
        'Staking program:',
        rewardsAvailable,
        'ZKP over',
        programDays,
        'days',
    );
    const annualRewards = rewardsAvailableBN.mul(365).div(programDays);
    console.log('Annual rewards:', formatCurrency(annualRewards));

    // Calculate as a percentage with healthy dose of precision
    const currentStakingAPY = totalStaked?.gt(constants.Zero)
        ? Number(annualRewards.mul(10000000).div(totalStaked)) / 10000000
        : 0;
    console.log(
        `Calculated APY as ${formatPercentage(
            currentStakingAPY,
        )} (${currentStakingAPY})`,
    );
    return currentStakingAPY;
};

const CurrentStakeAPY = () => {
    const context = useWeb3React();
    const {chainId} = context;
    const totalStaked = useAppSelector(totalStakedSelector);
    const currentStakingAPY = getAPY(totalStaked, chainId);
    const totalZKPStaked = totalStaked
        ? formatCurrency(totalStaked, {decimals: 0}) + ' ZKP'
        : '$ZKP';

    const getRewardPoolSize = useCallback(() => {
        if (!chainId) return '';
        return chainVar('REWARD_POOL_SIZE', chainId);
    }, [chainId]);

    const getRewardProgramText = useCallback(() => {
        if (!chainId) return '';
        const rewardsAvailable = getRewardPoolSize();
        const rewardsAvailableBN = BigNumber.from(rewardsAvailable).mul(E18);
        const programDays = chainVar('STAKING_PROGRAM_DURATION', chainId);
        return ` on a reward pool of ${formatCurrency(rewardsAvailableBN, {
            decimals: 0,
        })} ZKP available over ${programDays} days`;
    }, [getRewardPoolSize, chainId]);

    return (
        <Box className="current-stake-apy-container">
            {typeof currentStakingAPY === 'number' && (
                <Box className="current-stake-apy-inner">
                    <Typography>
                        <Tooltip
                            title={`Current APY based on ${totalZKPStaked} currently staked${getRewardProgramText()}. APY will reduce as more people stake.`}
                            data-html="true"
                            placement="top"
                            className="icon"
                        >
                            <IconButton size="small">
                                <img src={infoIcon} />
                            </IconButton>
                        </Tooltip>
                    </Typography>

                    <Typography className="apy-amount">
                        {formatPercentage(currentStakingAPY) || '??'}
                    </Typography>
                    <Typography className="apy-title">
                        Final staking APY
                    </Typography>
                </Box>
            )}
            {typeof currentStakingAPY !== 'number' && (
                <Box className="current-stake-apy-inner">
                    <Typography className="message-title">
                        Connect wallet
                        <br />
                        to see APY
                    </Typography>
                </Box>
            )}

            <Box className="current-stake-apy-text">
                <Typography className="message-title">
                    Earn rewards for staking $ZKP
                </Typography>
                <Typography className="message-text">
                    Along with earning from $ZKP reward pools, staking also
                    gives you voting rights on Panther DAO proposals.{' '}
                    <SafeMuiLink
                        href="https://docs.pantherprotocol.io/panther-dao-and-zkp/the-zkp-token/staking"
                        underline="always"
                        color="inherit"
                    >
                        Learn more
                    </SafeMuiLink>
                </Typography>
            </Box>
        </Box>
    );
};

export default CurrentStakeAPY;
