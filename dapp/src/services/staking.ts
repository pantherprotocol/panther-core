import type {TypedDataDomain} from '@ethersproject/abstract-signer';
import {JsonRpcSigner} from '@ethersproject/providers';
import type {TransactionResponse} from '@ethersproject/providers';
import CoinGecko from 'coingecko-api';
import {fromRpcSig} from 'ethereumjs-util';
import * as ethers from 'ethers';
import {BigNumber, Contract, constants, utils} from 'ethers';
import type {ContractTransaction} from 'ethers';

import {abi as REWARDS_MASTER_ABI} from '../abi/RewardsMaster';
import {abi as STAKING_ABI} from '../abi/Staking';
import {abi as STAKING_TOKEN_ABI} from '../abi/StakingToken';
import {abi as VESTING_POOLS_ABI} from '../abi/VestingPools';
import {Staking, IStakingTypes} from '../types/contracts/Staking';
import {CONFIRMATIONS_NUM} from '../utils';

import {
    REWARD_MASTER_CONTRACT,
    STAKING_CONTRACT,
    STAKING_TOKEN_CONTRACT,
    TOKEN_SYMBOL,
    VESTING_POOLS_CONTRACT,
} from './contracts';
import {openNotification, removeNotification} from './notification';

const CoinGeckoClient = new CoinGecko();

export async function getStakingContract(
    library,
): Promise<Staking | undefined> {
    if (!STAKING_CONTRACT) {
        console.error(`STAKING_CONTRACT not defined`);
        return;
    }
    if (!STAKING_ABI) {
        console.error(`STAKING_ABI not defined`);
        return;
    }
    return new ethers.Contract(
        STAKING_CONTRACT,
        STAKING_ABI,
        library,
    ) as Staking;
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

const EIP712_TYPES = {
    Permit: [
        {name: 'owner', type: 'address'},
        {name: 'spender', type: 'address'},
        {name: 'value', type: 'uint256'},
        {name: 'nonce', type: 'uint256'},
        {name: 'deadline', type: 'uint256'},
    ],
};

export async function generatePermitSignature(
    library: any,
    chainId: number,
    account: string,
    signer: JsonRpcSigner,
    tokenContract: Contract,
    amount: BigNumber,
    deadline: number,
) {
    const nonce = await tokenContract.nonces(account);
    const permitParams = {
        owner: account,
        spender: STAKING_CONTRACT,
        value: amount,
        nonce,
        deadline,
    };
    const domain: TypedDataDomain = {
        name: await tokenContract.name(),
        version: '1',
        chainId,
        verifyingContract: STAKING_TOKEN_CONTRACT,
    };

    const signature = await signer._signTypedData(
        domain,
        EIP712_TYPES,
        permitParams,
    );

    if (
        ethers.utils.verifyTypedData(
            domain,
            EIP712_TYPES,
            permitParams,
            signature,
        ) != account
    ) {
        console.error(
            `Failed to verify typed data as signed by ${account}`,
            domain,
            EIP712_TYPES,
            permitParams,
            signature,
        );
    }

    return signature;
}

function txError(msg: string, diagnostics: any): Error {
    console.error(msg, diagnostics);
    openNotification('Transaction error', msg, 'danger', 60000);
    return new Error(msg);
}

export async function stake(
    library: any,
    chainId: number | undefined,
    account: string,
    stakingContract: Staking,
    signer: JsonRpcSigner,
    amount: BigNumber, // assumes already validated as <= tokenBalance
    stakeType: string,
    data?: any,
): Promise<BigNumber | Error> {
    if (!chainId) {
        return new Error('stake(): missing chainId');
    }
    if (!stakingContract) {
        return new Error('stake(): missing Staking contract');
    }
    if (!signer) {
        return new Error('stake(): undefined signer');
    }

    const stakingContractSignable = stakingContract.connect(signer);

    let tx;
    try {
        tx = await initiateStakingTransaction(
            library,
            account,
            chainId,
            signer,
            stakingContractSignable,
            amount,
            stakeType,
            data,
        );
    } catch (err: any) {
        return txError(err.message || 'Failed to submit transaction.', err);
    }

    const inProgress = openNotification(
        'Transaction in progress',
        'Your staking transaction is currently in progress. Please wait for confirmation!',
        'info',
    );

    const receipt = await tx.wait(CONFIRMATIONS_NUM);
    if (!receipt) {
        return txError('Failed to get transaction receipt.', tx);
    }
    if (!receipt.events) {
        return txError('Failed to get transaction events.', receipt);
    }

    const event = receipt.events.find(({event}) => event === 'StakeCreated');
    if (!event) {
        return txError(
            'No StakeCreated event found for this transaction.',
            receipt.events,
        );
    }
    console.debug('StakeCreated event:', event);
    removeNotification(inProgress);
    openNotification(
        'Stake completed successfully',
        'Congratulations! Your staking transaction was processed!',
        'info',
        15000,
    );

    return event?.args?.stakeID;
}

async function initiateStakingTransaction(
    library: any,
    account: string,
    chainId: number,
    signer: JsonRpcSigner,
    stakingContractSignable: Staking,
    amount: BigNumber,
    stakeType: string,
    data: any = '0x00',
): Promise<ContractTransaction> {
    const tokenContract = await getStakingTokenContract(library);
    if (!tokenContract) {
        throw new Error('Could not initialize token contract');
    }

    const allowance = await getAllowance(library, account, tokenContract);
    console.debug(`Got allowance ${allowance} for ${account}`);
    const allowanceSufficient = amount.lte(allowance);
    if (allowanceSufficient) {
        console.debug(
            `Allowance ${utils.formatEther(
                allowance,
            )} >= ${amount}; using regular stake()`,
        );
        return await normalStake(
            library,
            account,
            stakingContractSignable,
            amount,
            stakeType,
            data,
        );
    } else {
        console.debug(
            `Allowance ${utils.formatEther(
                allowance,
            )} < ${amount}; using permitAndStake()`,
        );
        return await permitAndStake(
            library,
            account,
            chainId,
            signer,
            stakingContractSignable,
            tokenContract,
            amount,
            stakeType,
            data,
        );
    }
}

async function getAllowance(
    library: any,
    account: string,
    tokenContract: Contract,
): Promise<BigNumber> {
    console.debug(`Getting allowance for ${account} on ${STAKING_CONTRACT}`);
    return await tokenContract.allowance(account, STAKING_CONTRACT);
}

async function normalStake(
    library: any,
    account: string,
    contractSignable: Staking,
    amount: BigNumber,
    stakeType: string,
    data: any,
) {
    return await contractSignable.stake(amount, stakeType, data, {
        gasLimit: 320000,
    });
}

async function permitAndStake(
    library: any,
    account: string,
    chainId: number,
    signer: JsonRpcSigner,
    stakingContractSignable: Staking,
    tokenContract: Contract,
    amount: BigNumber,
    stakeType: string,
    data: any,
): Promise<TransactionResponse> {
    const now = Math.floor(new Date().getTime() / 1000);
    const deadline = now + 600; // within 10 minutes

    const permitSig = await generatePermitSignature(
        library,
        chainId,
        account,
        signer,
        tokenContract,
        amount,
        deadline,
    );
    const {v, r, s} = fromRpcSig(permitSig);

    return await stakingContractSignable.permitAndStake(
        account,
        amount,
        deadline,
        v,
        r,
        s,
        stakeType,
        data,
        {
            gasLimit: 400000,
        },
    );
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
        {
            gasLimit: 250000,
        },
    );

    try {
        await unstakingResponse.wait(CONFIRMATIONS_NUM);
    } catch (e: any) {
        return e;
    }

    return true;
}

export async function getAccountStakes(
    contract: Staking,
    address: string,
): Promise<IStakingTypes.StakeStructOutput[]> {
    return await contract.accountStakes(address);
}

function getActiveStakeAmount(
    stake: IStakingTypes.StakeStructOutput,
): BigNumber {
    return stake.claimedAt ? constants.Zero : stake.amount;
}

export function sumActiveAccountStakes(
    stakes: IStakingTypes.StakeStructOutput[],
): BigNumber {
    return stakes.reduce(
        (acc, stake) => acc.add(getActiveStakeAmount(stake)),
        constants.Zero,
    );
}

export async function getTotalStakedForAccount(
    contract: Staking,
    address: string | null | undefined,
): Promise<BigNumber | null> {
    if (!contract || !address) {
        return null;
    }
    const stakes = await getAccountStakes(contract, address);
    return sumActiveAccountStakes(stakes);
}

export async function getRewardsBalance(
    contract: ethers.Contract,
    address: string | null | undefined,
): Promise<BigNumber | null> {
    if (!contract) {
        return null;
    }
    return await contract.entitled(address);
}

export async function getStakingTransactionsNumber(
    contract: ethers.Contract,
    address: string | null | undefined,
): Promise<number | null> {
    if (!contract) {
        return null;
    }
    return await contract.stakesNum(address);
}

export async function getTotalStaked(contract: ethers.Contract): Promise<any> {
    if (!contract) {
        return null;
    }
    try {
        return await contract.totalStaked();
    } catch (err: any) {
        console.warn('Failed to fetch totalStaked from Staking contract:', err);
        return err;
    }
}

export async function getZKPMarketPrice(): Promise<BigNumber | null> {
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
    } catch (err: any) {
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
    const price = ethers.utils.parseUnits(
        String(priceData.data[symbol]['usd']),
        18,
    );
    return price;
}
