import {BigNumber, constants, utils} from 'ethers';

import {IStakingTypes} from '../types/contracts/Staking';
import {
    StakeRewardBN,
    ClassicStakeRewardBN,
    AdvancedStakeRewardsBN,
    StakingRewardTokenID,
} from '../types/staking';

import {MaspChainIds} from './connectors';
import {
    ContractName,
    getAdvancedStakeRewardControllerContract,
    getContractAddress,
    getPrpGrantorContract,
} from './contracts';
import {MASP_CHAIN_ID} from './env';
import {CLASSIC_TYPE_HEX, ADVANCED_TYPE_HEX} from './staking';
import {AdvancedStakeRewardsResponse} from './subgraph';

/* Constants are described in Advanced Staking Rewards document:
https://docs.google.com/document/d/1lsZlE3RsUlk-Dx_dXAqKxXKWZD18ZuuNA-DKoEsArm4/edit
*/
export const T_START = Number(process.env.ADVANCED_STAKING_T_START) * 1000;
export const T_END = Number(process.env.ADVANCED_STAKING_T_END) * 1000;
const APY_START = 70;
const APY_END = 40;
const DAPY_DT = (APY_END - APY_START) / (T_END - T_START);
// Due to the recent changes in the smart contract, the PRP UTXOs are not being
// generated upon staking. This is a temporary solution to hardcode the PRP
// rewards. Only first 2000 stakes will get 2000 PRP rewards. The rest will get
// 0 PRP rewards. This will be removed once the PRP UTXOs are generated upon
// deployment of the version 1.0 of the protocol. MASP doc:
// https://docs.google.com/document/d/1BTWHstTgNKcapOe0PLQR41vbC0aEDYmbBenfzTq8TVs
export const PRP_REWARD_PER_STAKE = '2000';
export const NUMBER_OF_FIRST_STAKES_GET_PRP_REWARD = 2000;

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
    const rewardEnd = lockedTill < T_END ? lockedTill : T_END;
    const rewardStart = T_START < timeStaked ? timeStaked : T_START;

    // Fraction of a year that the stake has accumulated rewards
    const oneYear = 3600 * 24 * 365 * 1000;
    const timeFracStaked = (rewardEnd - rewardStart) / oneYear;

    // Reward amount as fraction of principal staked (calculated from annual APY
    // scaled to time staked).
    const rewardCoef = (getAdvStakingAPY(rewardStart) / 100) * timeFracStaked;

    // Calculate reward, truncating reward fraction to 6 decimals of precision.
    const rewardCoefE18 = Math.floor(rewardCoef * 1e18);
    if (rewardCoefE18 < 1) {
        return constants.Zero;
    }

    const e18 = BigNumber.from(10).pow(18);
    return amount.mul(rewardCoefE18.toString()).div(e18);
}

export function prpReward(): BigNumber {
    return BigNumber.from(PRP_REWARD_PER_STAKE);
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
            throw new Error('Cannot estimate rewards: unknown stake type');
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
        throw new Error(
            'Cannot estimate rewards: rewardsBalance should be defined',
        );
    }

    if (!totalStaked) {
        throw new Error(
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
            // TODO: this hardcoded value should be removed in v 1.0 Due to the
            // recent changes in the smart contract, the PRP UTXOs are not being
            // generated upon staking. This is a temporary solution to hardcode
            // the PRP rewards. Only first 2000 stakes will get 2000 PRP
            // rewards. The rest will get 0 PRP rewards. This will be removed
            // once the PRP UTXOs are generated upon deployment of the version
            // 1.0 of the protocol. Magic number 4 comes from the fact that
            // commitments generate 4 leaves in the tree. Therefore, to get the
            // sequential number of the stake, we need to divide the left leafId
            // by 4.
            const quadIndex = BigNumber.from(rewards.id).toNumber() / 4;
            const prpAmount =
                quadIndex < NUMBER_OF_FIRST_STAKES_GET_PRP_REWARD
                    ? PRP_REWARD_PER_STAKE
                    : '0';

            return {
                [StakingRewardTokenID.zZKP]: BigNumber.from(rewards.zZkpAmount),
                [StakingRewardTokenID.PRP]: BigNumber.from(prpAmount),
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
        [StakingRewardTokenID.PRP]: prpReward(),
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

export async function rewardsVested(): Promise<BigNumber | Error> {
    try {
        const maspChainId = MASP_CHAIN_ID as MaspChainIds;
        const contract = getAdvancedStakeRewardControllerContract(maspChainId);
        const limits = await contract.limits();
        return limits.zkpRewards;
    } catch (error) {
        const msg = new Error(`Failed to get total rewards. ${error}`);
        console.error(msg);
        return msg;
    }
}

export async function rewardsClaimed(): Promise<BigNumber | Error> {
    try {
        const maspChainId = MASP_CHAIN_ID as MaspChainIds;
        const contract = getAdvancedStakeRewardControllerContract(maspChainId);
        const totals = await contract.totals();
        return totals.zkpRewards;
    } catch (error) {
        const msg = new Error(`Failed to get rewards claimed. ${error}`);
        console.error(msg);
        return msg;
    }
}
