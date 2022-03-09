import React, {useCallback} from 'react';

import {IconButton, Tooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {useWeb3React} from '@web3-react/core';
import {BigNumber} from 'ethers';

import infoIcon from '../../images/info-icon.svg';
import {chainVar} from '../../services/env';
import {E18} from '../../utils/constants';
import {formatCurrency, formatPercentage} from '../../utils/helpers';
import {SafeMuiLink} from '../Common/links';

import './styles.scss';

const TOTAL_REWARDS_AVAILABLE = 6_650_000 + 2_000_000;

const CurrentStakeAPY = (props: {
    networkName: string | undefined;
    currentAPY: number | null;
    totalZKPStaked: BigNumber | null;
}) => {
    const context = useWeb3React();
    const {chainId} = context;

    const totalZKPStaked = props.totalZKPStaked
        ? formatCurrency(props.totalZKPStaked, {decimals: 0}) + ' ZKP'
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

    const getPoolSizeText = useCallback(() => {
        const poolSize = getRewardPoolSize();
        const poolSizeText = Number(poolSize || TOTAL_REWARDS_AVAILABLE) / 1e6;
        return poolSize && props.networkName
            ? `a ${poolSizeText} million $ZKP rewards pool on ${props.networkName}`
            : `${poolSizeText} million in $ZKP reward pools`;
    }, [getRewardPoolSize, props]);

    return (
        <Box className="current-stake-apy-container">
            {typeof props.currentAPY === 'number' && (
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
                        {formatPercentage(props.currentAPY) || '??'}
                    </Typography>
                    <Typography className="apy-title">
                        Current staking APY
                    </Typography>
                </Box>
            )}
            {typeof props.currentAPY !== 'number' && (
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
                    Earn rewards for staking ZKP
                </Typography>
                <Typography className="message-text">
                    Along with earning from {getPoolSizeText()}, staking also
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
