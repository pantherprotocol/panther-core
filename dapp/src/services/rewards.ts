import {BigNumber, constants} from 'ethers';

import {IStakingTypes} from '../types/contracts/Staking';

import {CLASSIC_TYPE_HEX, ADVANCED_TYPE_HEX} from './staking';

export type Rewards = ClassicRewards | AdvancedRewards;

export type ClassicRewards = BigNumber;

export interface AdvancedRewards {
    [tokenId: string]: BigNumber;
}

export enum TokenID {
    ZKP,
    zZKP,
    PRP,
}

/* Constants are described in Advanced Staking Rewards document:
https://docs.google.com/document/d/1lsZlE3RsUlk-Dx_dXAqKxXKWZD18ZuuNA-DKoEsArm4/edit
*/
export const T_START = Number(process.env.ADVANCED_STAKING_T_START);
export const T_END = Number(process.env.ADVANCED_STAKING_T_END);
const APY_START = 70;
const APY_END = 45;
const DAPY_DT = (APY_END - APY_START) / (T_END - T_START);
// The actual PRP reward coefficient is 1e-3,
// i.e., 1 PRP reward for every 1000 $ZKP staked.
// We use the inverse of 1e-3 for BigNumber math convenience
const PRP_COEF_INV = 1000;

export function zZkpReward(amount: BigNumber, timeStaked: number): BigNumber {
    if (timeStaked < T_START) {
        throw new Error(
            'Cannot estimate rewards: time staked is before the start of the rewards',
        );
    }

    if (timeStaked > T_END) {
        throw new Error(
            'Cannot estimate rewards: time staked is after the end of the rewards',
        );
    }

    const oneYear = 3600 * 24 * 365 * 1000;
    const timeFracStaked = (T_END - timeStaked) / oneYear;
    const rewardCoef = (getAdvStakingAPY(timeStaked) / 100) * timeFracStaked;
    const rewardCoefE6 = Math.floor(rewardCoef * 1e6);
    if (rewardCoefE6 < 1) {
        return constants.Zero;
    }

    const e6 = BigNumber.from(10).pow(6);
    return amount.mul(rewardCoefE6).div(e6);
}

export function prpReward(amount: BigNumber): BigNumber {
    return amount.div(PRP_COEF_INV);
}

export function getAdvStakingAPY(currentTime: number): number {
    if (currentTime < T_START) {
        return APY_START;
    }
    if (currentTime > T_END) {
        return APY_END;
    }

    const currentAPY = APY_END + (currentTime - T_END) * DAPY_DT;

    if (
        currentAPY < Math.min(APY_START, APY_END) ||
        currentAPY > Math.max(APY_START, APY_END)
    ) {
        throw new Error(
            `Calculated APY ${currentAPY} is not in the range of [${Math.min(
                APY_START,
                APY_END,
            )}, ${Math.max(APY_START, APY_END)}].`,
        );
    }
    return currentAPY;
}

export function calculateRewardsForStake(
    stake: IStakingTypes.StakeStructOutput,
    rewardsBalance: BigNumber | null,
    totalStaked: BigNumber | null,
    classicReward: BigNumber | null,
): Rewards {
    switch (stake.stakeType) {
        case CLASSIC_TYPE_HEX:
            return calculateRewardsForClassicStake(
                stake,
                rewardsBalance,
                totalStaked,
                classicReward,
            );
        case ADVANCED_TYPE_HEX:
            return calculateRewardsForAdvancedStake(stake);
        default:
            throw new Error('Cannot estimate rewards: unknown stake type');
    }
}

export function calculateRewardsForClassicStake(
    stake: IStakingTypes.StakeStructOutput,
    rewardsBalance: BigNumber | null,
    totalStaked: BigNumber | null,
    classicReward: BigNumber | null,
): ClassicRewards {
    if (classicReward) {
        return classicReward;
    }

    if (!rewardsBalance) {
        throw new Error(
            'Cannot estimate rewards: rewardsBalance should be defined',
        );
    }

    if (!totalStaked) {
        throw new Error(
            'Cannot estimate rewards: totalStaked should be defined',
        );
    }

    return rewardsBalance.mul(stake.amount).div(totalStaked);
}

export function calculateRewardsForAdvancedStake(
    stake: IStakingTypes.StakeStructOutput,
): AdvancedRewards {
    return {
        // x1000 is conversion to ms as in Date.getTime() method.
        [TokenID.zZKP]: zZkpReward(stake.amount, stake.stakedAt * 1000),
        [TokenID.PRP]: prpReward(stake.amount),
    };
}
