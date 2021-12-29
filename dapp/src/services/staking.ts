import * as ethers from 'ethers';

import {abi as REWARDS_MASTER_ABI} from '../abi/RewardsMaster';
import {abi as STAKING_ABI} from '../abi/Staking';

export const STAKING_CONTRACT = process.env.STAKING_CONTRACT;
export const REWARDS_MASTER_CONTRACT = process.env.REWARDS_MASTER_CONTRACT;

export async function getRewardsMasterContract(library): Promise<ethers.Contract> {
    return new ethers.Contract(
        // Guaranteed to be non-null due to check in src/index.tsx
        REWARDS_MASTER_CONTRACT!,
        REWARDS_MASTER_ABI,
        library,
    );
}

export async function getStakingContract(
    library,
): Promise<ethers.Contract> {
    return new ethers.Contract(
        // Guaranteed to be non-null due to check in src/index.tsx
        STAKING_CONTRACT!,
        STAKING_ABI,
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
        console.debug(
            `getStakedEventFromBlock: got ${eventName} log`,
            logs[0],
        );
    }
    return logs[0];
}
