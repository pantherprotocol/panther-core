// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {E18} from 'constants/numbers';
import {oneYearInMs} from 'constants/time';

import {BigNumber, constants, utils} from 'ethers';
import {AdvancedStakeRewardsResponse} from 'subgraph';
import {MaspChainIds} from 'types/contracts';
import {IStakingTypes} from 'types/contracts/Staking';
import {
    StakeRewardBN,
    ClassicStakeRewardBN,
    AdvancedStakeRewardsBN,
    StakingRewardTokenID,
} from 'types/staking';

import {
    ContractName,
    getAdvancedStakeRewardControllerContract,
    getContractAddress,
    getPrpGrantorContract,
} from './contracts';
import {MASP_CHAIN_ID, env} from './env';
import {MultiError} from './errors';
import {CLASSIC_TYPE_HEX, ADVANCED_TYPE_HEX} from './staking';

/* Constants are described in Advanced Staking Rewards document:
https://docs.google.com/document/d/1lsZlE3RsUlk-Dx_dXAqKxXKWZD18ZuuNA-DKoEsArm4/edit
*/
export const T_START = Number(process.env.ADVANCED_STAKING_T_START) * 1000;
export const T_END = Number(process.env.ADVANCED_STAKING_T_END) * 1000;
export const APY_START = Number(process.env.ADVANCED_STAKING_APY_START);
export const APY_END = Number(process.env.ADVANCED_STAKING_APY_END);
const DAPY_DT = (APY_END - APY_START) / (T_END - T_START);
export const UNREALIZED_PRP_REWARD_PER_ZZKP = 10;
// Due to the recent changes in the smart contract, the PRP UTXOs are not being
// generated upon staking. This is a temporary solution to hardcode the PRP
// rewards. Only first 2000 stakes will get 2000 PRP rewards. The rest will get
// 0 PRP rewards. This will be removed once the PRP UTXOs are generated upon
// deployment of the version 1.0 of the protocol. MASP doc:
// https://docs.google.com/document/d/1BTWHstTgNKcapOe0PLQR41vbC0aEDYmbBenfzTq8TVs
export const PRP_REWARD_PER_STAKE = '2000';
// The timestamp (ms) of the block when the last of 2000 PRP rewards was generated.
// https://polygonscan.com/tx/0x3314b6a4c89e300c55dcee276699fc92dae64a6882406bc836a138467201c10f
export const LAST_OF_2000_REWARDS_GENERATED_AT = 1670641065000;

export function calculateRewardBasedOnAPR(
    amount: BigNumber,
    apy: number,
    rewardStart: number,
    rewardEnd: number,
): BigNumber {
    // Fraction of a year that the stake has accumulated rewards
    const timeFracStaked = (rewardEnd - rewardStart) / oneYearInMs;

    // Reward amount as fraction of principal staked (calculated from annual APY
    // scaled to time staked).
    const rewardCoef = (apy / 100) * timeFracStaked;

    // Calculate reward, truncating reward fraction to 6 decimals of precision.
    const rewardCoefE18 = Math.floor(rewardCoef * 1e18);
    if (rewardCoefE18 < 1) {
        return constants.Zero;
    }

    return amount.mul(rewardCoefE18.toString()).div(E18);
}

export function zZkpReward(
    amount: BigNumber,
    timeStaked: number,
    lockedTill: number,
): BigNumber {
    if (timeStaked < T_START) {
        console.warn(
            `${utils.formatEther(
                amount,
            )} ZKP was staked at ${timeStaked} (${new Date(
                timeStaked,
            )}), before the start of the rewards ${T_START} (${new Date(
                T_START,
            )}); treating as if staked at the starting time.`,
        );
    }

    if (timeStaked > T_END) {
        console.warn(
            `${utils.formatEther(
                amount,
            )} ZKP was staked at ${timeStaked} (${new Date(
                timeStaked,
            )}), after the end of the rewards ${T_END} (${new Date(
                T_END,
            )}); treating as zero reward.`,
        );
        return constants.Zero;
    }

    const rewardStart = T_START < timeStaked ? timeStaked : T_START;
    // calculateRewardBasedOnAPR calculation assumes that lockedTill is less
    // than rewardEnd parameter specified in AdvancedStakeRewardController. For
    // details, see comparisons of lockedTill and _rewardParams.endTime in
    // _computeZkpReward() of AdvancedStakeRewardController.
    const rewardEnd = lockedTill;
    const apy = getAdvStakingAPY(rewardStart);
    return calculateRewardBasedOnAPR(amount, apy, rewardStart, rewardEnd);
}

export function prpReward(stakedAt: number): BigNumber {
    return stakedAt <= LAST_OF_2000_REWARDS_GENERATED_AT
        ? BigNumber.from(PRP_REWARD_PER_STAKE)
        : constants.Zero;
}

export function unrealizedPrpReward(
    zZkpAmount: BigNumber,
    rewardStart: number,
    rewardEnd = Date.now(),
): BigNumber {
    const apy = getPrpAPY();
    const prpAmount = zZkpAmount.mul(UNREALIZED_PRP_REWARD_PER_ZZKP).div(E18);
    return calculateRewardBasedOnAPR(prpAmount, apy, rewardStart, rewardEnd);
}

export function getPrpAPY(): number {
    return Number(env.APY_PRP);
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
        throw new MultiError(
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
    rewardsFromSubgraph?: AdvancedStakeRewardsResponse[],
): StakeRewardBN {
    switch (stake.stakeType) {
        case CLASSIC_TYPE_HEX:
            return calculateRewardsForClassicStake(
                stake,
                rewardsBalance,
                totalStaked,
                classicReward,
            );
        case ADVANCED_TYPE_HEX:
            return calculateRewardsForAdvancedStake(stake, rewardsFromSubgraph);
        default:
            throw new MultiError('Cannot estimate rewards: unknown stake type');
    }
}

export function calculateRewardsForClassicStake(
    stake: IStakingTypes.StakeStructOutput,
    rewardsBalance: BigNumber | null,
    totalStaked: BigNumber | null,
    classicReward: BigNumber | null,
): ClassicStakeRewardBN {
    if (classicReward) {
        return classicReward;
    }

    if (!rewardsBalance) {
        throw new MultiError(
            'Cannot estimate rewards: rewardsBalance should be defined',
        );
    }

    if (!totalStaked) {
        throw new MultiError(
            'Cannot estimate rewards: totalStaked should be defined',
        );
    }

    if (totalStaked.isZero()) {
        return constants.Zero;
    }

    return rewardsBalance.mul(stake.amount).div(totalStaked);
}

export function calculateRewardsForAdvancedStake(
    stake: IStakingTypes.StakeStructOutput,
    rewardsFromSubgraph?: AdvancedStakeRewardsResponse[],
): AdvancedStakeRewardsBN {
    if (rewardsFromSubgraph) {
        const rewards = rewardsFromSubgraph.find(
            (r: AdvancedStakeRewardsResponse) =>
                r.creationTime === stake.stakedAt,
        );

        if (rewards) {
            return {
                [StakingRewardTokenID.zZKP]: BigNumber.from(rewards.zZkpAmount),
                [StakingRewardTokenID.PRP]: prpReward(
                    rewards.creationTime * 1000,
                ),
            };
        }
    }

    // If no rewards from subgraph, fallback to zZkp and PRP rewards calculation.
    return {
        // x1000 is conversion to ms as in Date.getTime() method.
        [StakingRewardTokenID.zZKP]: zZkpReward(
            stake.amount,
            stake.stakedAt * 1000,
            stake.lockedTill * 1000,
        ),
        [StakingRewardTokenID.PRP]: prpReward(stake.stakedAt * 1000),
    };
}

export function isClassic(
    rewards: StakeRewardBN,
): rewards is ClassicStakeRewardBN {
    return rewards instanceof BigNumber;
}

export async function unusedPrpGrantAmount(): Promise<BigNumber | null> {
    const maspChainId = MASP_CHAIN_ID as MaspChainIds;
    const PrpGrantor = getPrpGrantorContract(maspChainId);
    const advancedStakeRewardControllerAddress = getContractAddress(
        ContractName.ADVANCED_STAKE_REWARD_CONTROLLER,
        maspChainId,
    );
    try {
        return await PrpGrantor.getUnusedGrantAmount(
            advancedStakeRewardControllerAddress,
        );
    } catch (err) {
        console.error(
            `Failed to get unused grant amount from PrpGrantor. ${err}`,
        );

        return null;
    }
}

export async function rewardsVested(): Promise<
    | {
          zkpRewards: BigNumber;
          nftRewards: number;
      }
    | MultiError
> {
    try {
        const maspChainId = MASP_CHAIN_ID as MaspChainIds;
        const contract = getAdvancedStakeRewardControllerContract(maspChainId);
        return contract.limits();
    } catch (error) {
        const msg = new MultiError(`Failed to get vested rewards. ${error}`);
        console.error(msg);
        return msg;
    }
}

export async function rewardsClaimed(): Promise<
    | {
          zkpRewards: BigNumber;
          nftRewards: number;
          scZkpStaked: number;
      }
    | MultiError
> {
    try {
        const maspChainId = MASP_CHAIN_ID as MaspChainIds;
        const contract = getAdvancedStakeRewardControllerContract(maspChainId);
        return await contract.totals();
    } catch (error) {
        const msg = new MultiError(`Failed to get claimed rewards. ${error}`);
        console.error(msg);
        return msg;
    }
}
