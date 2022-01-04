import * as ethers from 'ethers';

import {abi as REWARDS_MASTER_ABI} from '../abi/RewardsMaster';
import {abi as STAKING_ABI} from '../abi/Staking';
import {abi as VESTING_POOLS_ABI} from '../abi/VestingPools';
import {formatTokenBalance} from './account';

export const STAKING_CONTRACT = process.env.STAKING_CONTRACT;
export const REWARDS_MASTER_CONTRACT = process.env.REWARDS_MASTER_CONTRACT;
export const VESTING_POOLS_CONTRACT = process.env.VESTING_POOLS_CONTRACT;

export async function getStakingContract(library): Promise<ethers.Contract> {
    return new ethers.Contract(
        // Guaranteed to be non-null due to check in src/index.tsx
        STAKING_CONTRACT!,
        STAKING_ABI,
        library,
    );
}

export async function getRewardsMasterContract(
    library,
): Promise<ethers.Contract> {
    return new ethers.Contract(
        // Guaranteed to be non-null due to check in src/index.tsx
        REWARDS_MASTER_CONTRACT!,
        REWARDS_MASTER_ABI,
        library,
    );
}

export async function getVestingPoolsContract(
    library,
): Promise<ethers.Contract> {
    return new ethers.Contract(
        // Guaranteed to be non-null due to check in src/index.tsx
        VESTING_POOLS_CONTRACT!,
        VESTING_POOLS_ABI,
        library,
    );
}

export function toBytes32(data): string {
    return ethers.utils.hexZeroPad(data, 32);
}

export async function getStakedEventFromBlock(
    contract: ethers.Contract,
    eventName: string,
    stakeId: string,
    block: number,
) {
    // https://docs.ethers.io/v5/api/utils/abi/fragments/#fragments--output-formats
    const eventFilter = contract.filters[eventName](null, stakeId);
    const provider = contract.provider;
    const connection = (provider as ethers.providers.JsonRpcProvider)
        .connection;
    console.debug(
        `Searching ${
            connection ? connection.url + ' ' : ''
        }for ${eventName} logs ` + `in block ${block}; eventFilter:`,
        eventFilter,
    );
    const logs = await contract.queryFilter(eventFilter, block, block);
    if (!logs || logs.length === 0) {
        console.debug(`getStakedEventFromBlock: no ${eventName} logs found`);
        return;
    }
    if (logs.length > 1) {
        console.error(
            `getStakedEventFromBlock: got ${logs.length} ${eventName} logs`,
            logs,
        );
    } else {
        console.debug(`getStakedEventFromBlock: got ${eventName} log`, logs[0]);
    }
    return logs[0];
}

export async function stake(
    contract: ethers.Contract,
    amount: number,
    stakeType: string,
    data?: string,
): Promise<number | null> {
    if (!contract) {
        return null;
    }
    const stakeId: number = await contract.stake(amount, stakeType, data);
    return stakeId;
}

export async function unstake(
    contract: ethers.Contract,
    stakeID: number,
    data?: string,
    isForced = false,
): Promise<void | null> {
    if (!contract) {
        return null;
    }
    await contract.unstake(stakeID, data, isForced);
}

export async function getTotalStaked(
    contract: ethers.Contract,
    address: string | null | undefined,
): Promise<any> {
    if (!contract) {
        return null;
    }
    const totalStaked: any = await contract.accountStakes(address);
    return totalStaked;
}

export async function getRewardsBalance(
    contract: ethers.Contract,
    address: string | null | undefined,
): Promise<number | null> {
    if (!contract) {
        return null;
    }
    const rewards: number = await contract.entitled(address);
    return formatTokenBalance(rewards);
}

export async function getStakingTransactionsNumber(
    contract: ethers.Contract,
    address: string | null | undefined,
): Promise<number | null> {
    if (!contract) {
        return null;
    }
    const stakesNumber: number = await contract.stakesNum(address);
    return stakesNumber;
}
