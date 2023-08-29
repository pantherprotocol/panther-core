// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {E18} from 'constants/numbers';
import {
    CLASSIC_TYPE_HEX,
    ADVANCED_TYPE_HEX,
    ADVANCED_2_TYPE_HEX,
    ADVANCED_3_TYPE_HEX,
    HEX_STAKE_TYPE_TO_STAKE_TYPE,
} from 'constants/stake-terms';
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
    StakeTermsByType,
} from 'types/staking';

import {
    ContractName,
    getAdvancedStakeRewardControllerContract,
    getContractAddress,
    getPrpGrantorContract,
} from './contracts';
import {MASP_CHAIN_ID, env} from './env';
import {MultiError} from './errors';

/* Constants are described in Advanced Staking Rewards document:
https://docs.google.com/document/d/1lsZlE3RsUlk-Dx_dXAqKxXKWZD18ZuuNA-DKoEsArm4/edit
*/
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

    // Calculate reward, truncating reward fraction to 18 decimals of precision.
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
    termsAllowedSince: number,
    termsAllowedTill: number,
): BigNumber {
    if (timeStaked < termsAllowedSince) {
        console.warn(
            `${utils.formatEther(
                amount,
            )} ZKP was staked at ${timeStaked} (${new Date(
                timeStaked,
            )}), before the start of the rewards ${termsAllowedSince} (${new Date(
                termsAllowedSince,
            )}); treating as if staked at the starting time.`,
        );
    }

    if (timeStaked > termsAllowedTill) {
        console.warn(
            `${utils.formatEther(
                amount,
            )} ZKP was staked at ${timeStaked} (${new Date(
                timeStaked,
            )}), after the end of the rewards ${termsAllowedTill} (${new Date(
                termsAllowedTill,
            )}); treating as zero reward.`,
        );
        return constants.Zero;
    }

    const rewardStart =
        termsAllowedSince < timeStaked ? timeStaked : termsAllowedSince;
    // calculateRewardBasedOnAPR calculation assumes that lockedTill is less
    // than rewardEnd parameter specified in AdvancedStakeRewardController. For
    // details, see comparisons of lockedTill and _rewardParams.endTime in
    // _computeZkpReward() of AdvancedStakeRewardController.
    const rewardEnd = lockedTill;
    const apy = getAdvStakingAPY();
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

export function getAdvStakingAPY(): number {
    return Number(env.ADVANCED_STAKING_APY);
}

export function calculateRewardsForStake(
    stake: IStakingTypes.StakeStructOutput,
    rewardsBalance: BigNumber | null,
    totalStaked: BigNumber | null,
    classicReward: BigNumber | null,
    stakeTermsByType: StakeTermsByType,
    rewardsFromSubgraph?: AdvancedStakeRewardsResponse[],
): StakeRewardBN {
    if (stake.stakeType === CLASSIC_TYPE_HEX) {
        return calculateRewardsForClassicStake(
            stake,
            rewardsBalance,
            totalStaked,
            classicReward,
        );
    }

    if (!stakeTermsByType) {
        throw new MultiError(
            'Cannot estimate rewards: stake terms are not defined',
        );
    }

    const stakeType = HEX_STAKE_TYPE_TO_STAKE_TYPE.get(stake.stakeType);
    if (!stakeType || !stakeTermsByType[stakeType]) {
        throw new MultiError(
            `Cannot estimate rewards: stake terms for stake type ${stake.stakeType} should be defined`,
        );
    }

    if (
        stake.stakeType === ADVANCED_TYPE_HEX ||
        stake.stakeType === ADVANCED_2_TYPE_HEX ||
        stake.stakeType === ADVANCED_3_TYPE_HEX
    ) {
        return calculateRewardsForAdvancedStake(
            stake,
            stakeTermsByType[stakeType]!.allowedSince,
            stakeTermsByType[stakeType]!.allowedTill,
            rewardsFromSubgraph,
        );
    }

    throw new MultiError(
        `Cannot estimate rewards: Unknown stake type ${stake.stakeType}`,
    );
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
    termsAllowedSince: number,
    termsAllowedTill: number,
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
            termsAllowedSince * 1000,
            termsAllowedTill * 1000,
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
