import * as ethers from 'ethers';

import {abi as REWARDS_MASTER_ABI} from '../abi/RewardsMaster';
import {abi as STAKING_ABI} from '../abi/Staking';
import {abi as STAKING_TOKEN_ABI} from '../abi/StakingToken';
import {abi as VESTING_POOLS_ABI} from '../abi/VestingPools';
import {Staking} from '../types/contracts/Staking';
import {formatTokenBalance} from './account';
import {JsonRpcSigner} from '@ethersproject/providers';
import CoinGecko from 'coingecko-api';
import {BigNumber, utils} from 'ethers';
import {
    REWARD_MASTER_CONTRACT,
    STAKING_CONTRACT,
    STAKING_TOKEN_CONTRACT,
    TOKEN_SYMBOL,
    VESTING_POOLS_CONTRACT,
} from './contracts';
import {CONFIRMATIONS_NUM, e18, toBN} from '../utils';
import {openNotification, removeNotification} from './notification';

const CoinGeckoClient = new CoinGecko();

export async function getStakingContract(
    library,
): Promise<ethers.Contract | undefined> {
    if (!STAKING_CONTRACT) {
        console.error(`STAKING_CONTRACT not defined`);
        return;
    }
    if (!STAKING_ABI) {
        console.error(`STAKING_ABI not defined`);
        return;
    }
    return new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, library);
}

export async function getStakingTokenContract(
    library,
): Promise<ethers.Contract | undefined> {
    if (!STAKING_TOKEN_CONTRACT) {
        console.error(`STAKING_TOKEN_CONTRACT not defined`);
        return;
    }
    if (!STAKING_TOKEN_ABI) {
        console.error(`STAKING_TOKEN_ABI not defined`);
        return;
    }
    return new ethers.Contract(
        STAKING_TOKEN_CONTRACT,
        STAKING_TOKEN_ABI,
        library,
    );
}

export async function getRewardsMasterContract(
    library,
): Promise<ethers.Contract | undefined> {
    if (!REWARD_MASTER_CONTRACT) {
        console.error(`REWARD_MASTER_CONTRACT not defined`);
        return;
    }
    if (!STAKING_TOKEN_ABI) {
        console.error(`STAKING_TOKEN_ABI not defined`);
        return;
    }
    return new ethers.Contract(
        REWARD_MASTER_CONTRACT,
        REWARDS_MASTER_ABI,
        library,
    );
}

export async function getVestingPoolsContract(
    library,
): Promise<ethers.Contract | undefined> {
    if (!VESTING_POOLS_CONTRACT) {
        console.error(`VESTING_POOLS_CONTRACT not defined`);
        return;
    }
    if (!VESTING_POOLS_ABI) {
        console.error(`VESTING_POOLS_ABI not defined`);
        return;
    }
    return new ethers.Contract(
        VESTING_POOLS_CONTRACT,
        VESTING_POOLS_ABI,
        library,
    );
}

export function toBytes32(data): string {
    return ethers.utils.hexZeroPad(data, 32);
}

const countDecimals = function (value) {
    if (value % 1 != 0) return value.toString().split('.')[1].length;
    return 0;
};

async function getApproval(
    stakingTokenSignableContract: Staking,
    scaledAmount: BigNumber,
): Promise<Error | undefined> {
    console.debug(`Calling approve(${STAKING_CONTRACT}, ${scaledAmount})`);
    const approvedStatus = await stakingTokenSignableContract.approve(
        STAKING_CONTRACT,
        scaledAmount,
    );
    const notificationId = openNotification(
        'Approval in progress',
        'Your transaction to approve the staking contract to spend your ZKP is currently in progress. Please wait for confirmation!',
        'info',
        15000,
    );
    console.debug(`got notificationId ${notificationId}`);
    let approveTransactionResponse;
    try {
        approveTransactionResponse = await approvedStatus.wait(
            CONFIRMATIONS_NUM,
        );
    } catch (e) {
        console.error(
            'Approval transaction gone wrong:',
            approveTransactionResponse,
        );
        openNotification(
            'Transaction error',
            'Approval transaction gone wrong: ' + approveTransactionResponse,
            'danger',
        );
        return e;
    }
    console.debug('removing notification', notificationId);
    removeNotification(notificationId);
    return;
}

export async function stake(
    library: any,
    account: string,
    contract: ethers.Contract,
    balance: string,
    amount: string,
    stakeType: string,
    signer: JsonRpcSigner,
    data?: any,
): Promise<BigNumber | Error> {
    if (!contract) {
        return new Error('Missing contract parameter');
    }

    if (!signer) {
        return new Error('stake(): Undefined signer');
    }

    const decimals = countDecimals(Number(amount));
    const adjustedAmount = Number(amount) * 10 ** decimals;
    const eDecimal = toBN(10).pow(toBN(decimals));
    const scaledAmount = toBN(adjustedAmount).mul(e18).div(eDecimal);

    const stakingTokenContract = await getStakingTokenContract(library);
    if (!stakingTokenContract) {
        return new Error('Could not initialize staking contract');
    }
    const stakingTokenSignableContract = stakingTokenContract.connect(
        signer,
    ) as Staking;

    if (Number(amount) > Number(balance)) {
        const msg = `Tried to stake ${amount} > balance ${balance}`;
        console.error(msg);
        openNotification(
            'Transaction error',
            msg + '. Please try again with smaller amount.',
            'danger',
        );
        return new Error(msg);
    }

    console.debug(`Getting allowance for ${account} on ${STAKING_CONTRACT}`);
    const allowance = await stakingTokenSignableContract.allowance(
        account,
        STAKING_CONTRACT,
    );
    console.debug(`Got allowance ${allowance} for ${account}`);
    if (utils.parseUnits(amount, 18).gt(allowance)) {
        const error = await getApproval(
            stakingTokenSignableContract,
            scaledAmount,
        );
        if (error) {
            return error;
        }
        // const notificationId = openNotification(
        //     'Approval succeeded',
        //     'Your transaction to approve the staking contract to spend your ZKP succeeded.',
        //     'info',
        // );
    } else {
        console.debug(
            `Allowance ${utils.formatEther(
                allowance,
            )} >= ${amount}; skipping approval`,
        );
    }

    const stakingSigner = contract.connect(signer);

    console.debug(
        'Scaled amount: ',
        scaledAmount.toString(),
        'amount: ',
        amount,
    );

    let stakingResponse: any;

    try {
        stakingResponse = await stakingSigner.stake(
            scaledAmount,
            stakeType,
            data ? data : '0x00',
            {gasLimit: 320000},
        );
    } catch (e) {
        console.error('Staking transaction gone wrong:', stakingResponse);
        openNotification(
            'Transaction error',
            'Staking transaction gone wrong: ' + stakingResponse,
            'danger',
        );
        return e;
    }

    openNotification(
        'Transaction in progress',
        'Your staking transaction is currently in progress. Please wait for confirmation!',
        'info',
    );

    const stakeTransactionResponse = await stakingResponse.wait(
        CONFIRMATIONS_NUM,
    );

    console.debug(stakeTransactionResponse.events);
    const event = stakeTransactionResponse.events.find(
        ({event}) => event === 'StakeCreated',
    );
    console.debug(event);
    if (!event) {
        const msg = 'No StakeCreated event found for this transaction.';
        console.error(msg);
        openNotification('Transaction error', msg, 'danger');
        return new Error(msg);
    }
    openNotification(
        'Stake completed successfully',
        'Congratulations! Your staking transaction was processed!',
        'info',
    );

    return event?.args.stakeID;
}

export async function unstake(
    library: any,
    contract: ethers.Contract,
    stakeID: BigNumber,
    signer: JsonRpcSigner,
    data?: string,
    isForced = false,
): Promise<boolean | Error> {
    if (!contract) {
        return new Error('Missing contract parameter');
    }

    const stakingSigner = contract.connect(signer);

    const unstakingResponse: any = await stakingSigner.unstake(
        stakeID,
        data ? data : '0x00',
        isForced,
    );

    try {
        await unstakingResponse.wait(CONFIRMATIONS_NUM);
    } catch (e) {
        return e;
    }

    return true;
}

export async function getAccountStakes(
    contract: ethers.Contract,
    address: string | null | undefined,
): Promise<any> {
    if (!contract) {
        return null;
    }
    const stakes: any = await contract.accountStakes(address);
    return stakes;
}

export async function getRewardsBalance(
    contract: ethers.Contract,
    tokenContract: ethers.Contract,
    address: string | null | undefined,
): Promise<string | null> {
    if (!contract) {
        return null;
    }
    const rewards: BigNumber = await contract.entitled(address);
    const decimal = await tokenContract.decimals();
    return formatTokenBalance(rewards, decimal);
}

export async function getRewardsBalanceForCalculations(
    contract: ethers.Contract,
    tokenContract: ethers.Contract,
    address: string | null | undefined,
): Promise<BigNumber | null> {
    if (!contract) {
        return null;
    }
    const rewards: BigNumber = await contract.entitled(address);
    return rewards;
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

export async function getTotalStaked(
    contract: ethers.Contract,
): Promise<number | null | Error> {
    if (!contract) {
        return null;
    }
    try {
        return await contract.totalStaked();
    } catch (err) {
        console.warn('Failed to fetch totalStaked from Staking contract:', err);
        return err;
    }
}

export async function getZKPMarketPrice(): Promise<number | null> {
    const symbol = TOKEN_SYMBOL;
    if (!symbol || symbol === 'none') {
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
