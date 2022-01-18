import * as ethers from 'ethers';

import {abi as REWARDS_MASTER_ABI} from '../abi/RewardsMaster';
import {abi as STAKING_ABI} from '../abi/Staking';
import {abi as STAKING_TOKEN_ABI} from '../abi/StakingToken';
import {abi as VESTING_POOLS_ABI} from '../abi/VestingPools';
import {formatTokenBalance} from './account';
import {JsonRpcSigner} from '@ethersproject/providers';
import CoinGecko from 'coingecko-api';

const CoinGeckoClient = new CoinGecko();

export const STAKING_CONTRACT = process.env.STAKING_CONTRACT;
export const REWARDS_MASTER_CONTRACT = process.env.REWARDS_MASTER_CONTRACT;
export const VESTING_POOLS_CONTRACT = process.env.VESTING_POOLS_CONTRACT;
export const STAKING_TOKEN_CONTRACT = process.env.STAKING_TOKEN_CONTRACT;
export const TOKEN_SYMBOL = process.env.TOKEN_SYMBOL;

export async function getStakingContract(library): Promise<ethers.Contract> {
    return new ethers.Contract(
        // Guaranteed to be non-null due to check in src/index.tsx
        STAKING_CONTRACT!,
        STAKING_ABI,
        library,
    );
}

export async function getStakingTokenContract(
    library,
): Promise<ethers.Contract> {
    return new ethers.Contract(
        // Guaranteed to be non-null due to check in src/index.tsx
        STAKING_TOKEN_CONTRACT!,
        STAKING_TOKEN_ABI,
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
    library: any,
    contract: ethers.Contract,
    amount: string,
    stakeType: string,
    signer: JsonRpcSigner,
    data?: any,
): Promise<number | null> {
    if (!contract) {
        return null;
    }

    const stakingTokenContract = await getStakingTokenContract(library);
    const stakingTokenSigner = stakingTokenContract.connect(signer);
    const approvedStatus = await stakingTokenSigner.approve(
        STAKING_CONTRACT,
        Number(amount),
    );

    if (approvedStatus) {
        const stakingSigner = contract.connect(signer);

        const stakeId: number = await stakingSigner.stake(
            Number(amount),
            stakeType,
            data ? data : '0x00',
        );
        return stakeId;
    }

    return null;
}

export async function unstake(
    contract: ethers.Contract,
    stakeID: number,
    signer: any,
    data?: string,
    isForced = false,
): Promise<void | null> {
    if (!contract) {
        return null;
    }
    const stakingSigner = contract.connect(signer);
    await stakingSigner.unstake(stakeID, data ? data : {}, isForced);
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
    tokenContract: ethers.Contract,
    address: string | null | undefined,
): Promise<string | null> {
    if (!contract) {
        return null;
    }
    const rewards: number = await contract.entitled(address);
    const decimal = await tokenContract.decimals();
    return formatTokenBalance(rewards, decimal);
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

export async function getZKPMarketPrice(): Promise<number | null> {
    const symbol = TOKEN_SYMBOL;
    if (!symbol) {
        console.warn('TOKEN_SYMBOL not defined');
        return null;
    }

    let priceData;
    try {
        priceData = await CoinGeckoClient.simple.price({
            ids: [symbol],
            vs_currencies: ['usd'],
        });
    } catch (err) {
        console.warn(`Failed to fetch ${symbol} from coingecko`, err);
        return null;
    }

    if (!priceData.data) {
        console.warn('Coingecko price response was missing data');
        return null;
    }

    if (!priceData.data[symbol]) {
        console.warn(`Coingecko price response was missing ${symbol}`);
        return null;
    }
    return priceData.data[symbol]['usd'];
}
