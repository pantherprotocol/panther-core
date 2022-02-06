import {TransactionResponse} from '@ethersproject/abstract-provider';
import {TypedDataDomain} from '@ethersproject/abstract-signer';
import {JsonRpcSigner} from '@ethersproject/providers';
import CoinGecko from 'coingecko-api';
import {fromRpcSig} from 'ethereumjs-util';
import * as ethers from 'ethers';
import {BigNumber, Contract, ContractTransaction, utils} from 'ethers';

import {abi as REWARDS_MASTER_ABI} from '../abi/RewardsMaster';
import {abi as STAKING_ABI} from '../abi/Staking';
import {abi as STAKING_TOKEN_ABI} from '../abi/StakingToken';
import {abi as VESTING_POOLS_ABI} from '../abi/VestingPools';
import {Staking} from '../types/contracts/Staking';
import {CONFIRMATIONS_NUM, e18, toBN} from '../utils';

import {formatTokenBalance} from './account';
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
    scaledAmount: BigNumber,
    deadline: number,
) {
    const nonce = await tokenContract.nonces(account);
    const permitParams = {
        owner: account,
        spender: STAKING_CONTRACT,
        value: scaledAmount,
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
    balance: string,
    amount: string,
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

    if (Number(amount) > Number(balance)) {
        const msg = `Tried to stake ${amount} > balance ${balance}`;
        console.error(msg);
        openNotification(
            'Transaction error',
            msg + '. Please try again with smaller amount.',
            'danger',
        );
        return new Error(msg);
    } else {
        console.debug(`Will stake ${amount} <= balance ${balance}`);
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
    } catch (err) {
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

function getScaledAmount(amount: string): BigNumber {
    const decimals = countDecimals(Number(amount));
    const adjustedAmount = Number(amount) * 10 ** decimals;
    const eDecimal = toBN(10).pow(toBN(decimals));
    return toBN(adjustedAmount).mul(e18).div(eDecimal);
}

const countDecimals = function (value) {
    if (value % 1 != 0) return value.toString().split('.')[1].length;
    return 0;
};

async function initiateStakingTransaction(
    library: any,
    account: string,
    chainId: number,
    signer: JsonRpcSigner,
    stakingContractSignable: Staking,
    amount: string,
    stakeType: string,
    data?: any = '0x00',
): ContractTransaction {
    const tokenContract = await getStakingTokenContract(library);
    if (!tokenContract) {
        throw new Error('Could not initialize token contract');
    }

    const scaledAmount = getScaledAmount(amount);
    console.debug(
        'Scaled amount: ',
        scaledAmount.toString(),
        'amount: ',
        amount,
    );

    const allowance = await getAllowance(library, account, tokenContract);
    console.debug(`Got allowance ${allowance} for ${account}`);
    const allowanceSufficient = utils.parseUnits(amount, 18).lte(allowance);
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
            scaledAmount,
            stakeType,
            data,
        );
    } else {
        console.debug(
            `Allowance ${utils.formatEther(
                allowance,
            )} >= ${amount}; using permitAndStake()`,
        );
        return await permitAndStake(
            library,
            account,
            chainId,
            signer,
            stakingContractSignable,
            tokenContract,
            scaledAmount,
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
    scaledAmount: BigNumber,
    stakeType: string,
    data: any,
) {
    return await contractSignable.stake(scaledAmount, stakeType, data, {
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
    scaledAmount: BigNumber,
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
        scaledAmount,
        deadline,
    );
    const {v, r, s} = fromRpcSig(permitSig);

    return await stakingContractSignable.permitAndStake(
        account,
        scaledAmount,
        deadline,
        v,
        r,
        s,
        stakeType,
        data,
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
