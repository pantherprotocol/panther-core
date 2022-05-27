import type {TypedDataDomain} from '@ethersproject/abstract-signer';
import type {TransactionResponse} from '@ethersproject/providers';
import {JsonRpcSigner} from '@ethersproject/providers';
import CoinGecko from 'coingecko-api';
import {fromRpcSig} from 'ethereumjs-util';
import type {ContractTransaction, Signer} from 'ethers';
import {BigNumber, constants, utils} from 'ethers';

import {MessageWithTx} from '../components/Common/MessageWithTx';
import {CONFIRMATIONS_NUM} from '../lib/constants';
import {bigintToBytes32} from '../lib/conversions';
import {parseTxErrorMessage} from '../lib/errors';
import {
    generateEphemeralKeypair,
    generateChildPublicKey,
} from '../lib/keychain';
import {getEventFromReceipt} from '../lib/transactions';
import type {IStakingTypes, Staking} from '../types/contracts/Staking';
import {StakeRewardBN, StakeTypes} from '../types/staking';

import {
    ContractName,
    chainHasAdvancedStaking,
    chainHasStakesReporter,
    getContractAddress,
    getRewardMasterContract,
    getStakeRewardController2Contract,
    getSignableContract,
    getStakesReporterContract,
    getStakingContract,
    getTokenContract,
    hasContract,
} from './contracts';
import {env} from './env';
import {notifyError} from './errors';
import {deriveRootKeypairs} from './keychain';
import {encryptEphemeralKey} from './message-encryption';
import {openNotification, removeNotification} from './notification';
import {calculateRewardsForStake} from './rewards';

const CoinGeckoClient = new CoinGecko();

export const CLASSIC_TYPE_HEX = utils.id('classic').slice(0, 10);
export const ADVANCED_TYPE_HEX = utils.id('advanced').slice(0, 10);

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
    amount: BigNumber,
    deadline: number,
) {
    const stakingContract = getStakingContract(library, chainId);
    const tokenContract = getTokenContract(library, chainId);
    const nonce = await tokenContract.nonces(account);
    const permitParams = {
        owner: account,
        spender: stakingContract.address,
        value: amount,
        nonce,
        deadline,
    };
    const domain: TypedDataDomain = {
        name: await tokenContract.name(),
        version: '1',
        chainId,
        verifyingContract: tokenContract.address,
    };

    const signature = await signer._signTypedData(
        domain,
        EIP712_TYPES,
        permitParams,
    );

    if (
        utils.verifyTypedData(domain, EIP712_TYPES, permitParams, signature) !=
        account
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

// craftAdvancedStakeData is a helper function to create the bytes data argument for
// stake() function in Staking.sol smart contract with 'advanced' stake type.
async function craftAdvancedStakeData(signer: Signer): Promise<string> {
    /*
    returned value is hex string in the following format:
    const advStakeData: string =
    '0x' + (
        S’[0].x, S’[0].y,
        S’[1].x, S’[1].y,
        S’[2].x, S’[2].y,
        IV[0],
        R[0].x,
        encrypted(prolog, r[0])),
        IV[1],
        R[1].x,
        encrypted(prolog, r[1])),
        IV[2],
        R[2].x,
        encrypted(prolog, r[2])),
    ).join('')
    */
    const [rootSpendingKeypair, rootReadingKeypair] = await deriveRootKeypairs(
        signer,
    );

    const publicSpendingKeys: string[] = [];
    const secretMsgs: string[] = [];

    // generate 3 spending pubKeys and secret messages:
    // one for each reward in zZKP, PRP, and NFT
    for (let index = 0; index < 3; index++) {
        const ephemeralKeypair = generateEphemeralKeypair();
        const publicSpendingKey = generateChildPublicKey(
            rootSpendingKeypair.publicKey,
            ephemeralKeypair.privateKey,
        );
        const msg = encryptEphemeralKey(
            ephemeralKeypair,
            rootReadingKeypair.publicKey,
        );

        publicSpendingKey.forEach((key: bigint) => {
            publicSpendingKeys.push(bigintToBytes32(key).slice(2));
        });

        secretMsgs.push(msg);
    }

    const advStakeData: string = [
        '0x',
        ...publicSpendingKeys,
        ...secretMsgs,
    ].join('');

    if (advStakeData.length % 2 !== 0) {
        const msg = `Advanced stake data has odd length of ${advStakeData.length}`;
        console.error(msg, {advStakeData, publicSpendingKeys, secretMsgs});
        throw new Error(msg);
    }

    return advStakeData;
}

export async function advancedStake(
    library: any,
    chainId: number,
    account: string,
    amount: BigNumber, // assumes already validated as <= tokenBalance
): Promise<BigNumber | Error> {
    if (!chainHasAdvancedStaking(chainId)) {
        return notifyError(
            'Error during stake',
            'Advanced staking is not supported on this chain',
            {
                chainId,
            },
        );
    }

    const signer = library.getSigner(account);
    const data = await craftAdvancedStakeData(signer);
    console.debug(`advanced stake data: ${data}`);

    return stake(library, chainId, account, amount, 'advanced', data);
}

export async function stake(
    library: any,
    chainId: number,
    account: string,
    amount: BigNumber, // assumes already validated as <= tokenBalance
    stakeType: string,
    data: string,
): Promise<BigNumber | Error> {
    const {signer, contract} = getSignableContract(
        library,
        chainId,
        account,
        getStakingContract,
    );

    const stakingTypeHex = utils
        .keccak256(utils.toUtf8Bytes(stakeType))
        .slice(0, 10);

    let tx: any;
    try {
        tx = await initiateStakingTransaction(
            library,
            account,
            chainId,
            signer,
            contract,
            amount,
            stakingTypeHex,
            data,
        );
    } catch (err) {
        return notifyError('Transaction error', parseTxErrorMessage(err), err);
    }

    const inProgress = openNotification(
        'Transaction in progress',
        'Your staking transaction is currently in progress. Please wait for confirmation!',
        'info',
    );

    const receipt = await tx.wait(CONFIRMATIONS_NUM);
    removeNotification(inProgress);

    const event = await getEventFromReceipt(receipt, 'StakeCreated');
    if (event instanceof Error) {
        return notifyError(
            'Transaction error',
            `Cannot find event in receipt. ${parseTxErrorMessage(event)}`,
            event,
        );
    }

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
    contract: Staking,
    amount: BigNumber,
    stakeType: string,
    data: any = '0x00',
): Promise<ContractTransaction> {
    const allowance = await getAllowance(library, chainId, account);
    if (!allowance) {
    }
    console.debug(`Got allowance ${allowance} for ${account}`);
    const allowanceSufficient = amount.lte(allowance);
    if (allowanceSufficient) {
        console.debug(
            `Allowance ${utils.formatEther(
                allowance,
            )} >= ${amount}; using regular stake()`,
        );
        return await normalStake(contract, amount, stakeType, data);
    } else {
        console.debug(
            `Allowance ${utils.formatEther(
                allowance,
            )} < ${amount}; using permitAndStake()`,
        );
        return await permitAndStake(
            library,
            chainId,
            account,
            signer,
            contract,
            amount,
            stakeType,
            data,
        );
    }
}

async function getAllowance(
    library: any,
    chainId: number,
    account: string,
): Promise<BigNumber> {
    const stakingContract = getContractAddress(ContractName.STAKING, chainId);
    const tokenContract = getTokenContract(library, chainId);
    console.debug(`Getting allowance for ${account} on ${stakingContract}`);
    return await tokenContract.allowance(account, stakingContract);
}

async function normalStake(
    contract: Staking,
    amount: BigNumber,
    stakeType: string,
    data: any,
) {
    return await contract.stake(amount, stakeType, data, {
        gasLimit: 320000,
    });
}

async function permitAndStake(
    library: any,
    chainId: number,
    account: string,
    signer: JsonRpcSigner,
    contract: Staking,
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
        amount,
        deadline,
    );
    const {v, r, s} = fromRpcSig(permitSig);

    return await contract.permitAndStake(
        account,
        amount,
        deadline,
        v,
        r,
        s,
        stakeType,
        data,
        {
            gasLimit: 500_000,
        },
    );
}

export async function unstake(
    library: any,
    chainId: number,
    account: string,
    stakeID: BigNumber,
    data?: string,
    isForced = false,
): Promise<Error | undefined> {
    const {contract} = getSignableContract(
        library,
        chainId,
        account,
        getStakingContract,
    );

    let tx: any;
    try {
        tx = await contract.unstake(stakeID, data ? data : '0x00', isForced, {
            gasLimit: 350_000,
        });
    } catch (e: any) {
        openNotification(
            'Transaction error',
            MessageWithTx({
                message: parseTxErrorMessage(e),
                txHash: tx?.hash,
            }),
            'danger',
        );
        return e as Error;
    }

    const inProgress = openNotification(
        'Transaction in progress',
        'Your unstaking transaction is currently in progress. Please wait for confirmation!',
        'info',
    );

    const receipt = await tx.wait(CONFIRMATIONS_NUM);
    removeNotification(inProgress);

    const event = await getEventFromReceipt(receipt, 'StakeClaimed');
    if (event instanceof Error) {
        return notifyError(
            'Transaction error',
            `Cannot find event in receipt. ${parseTxErrorMessage(event)}`,
            event,
        );
    }

    openNotification(
        'Unstaking completed successfully',
        'Congratulations! Your unstaking transaction was processed!',
        'info',
        15000,
    );
}

export async function getAccountStakes(
    library: any,
    chainId: number,
    account: string,
): Promise<IStakingTypes.StakeStructOutput[]> {
    const contract = getStakingContract(library, chainId);
    return await contract.accountStakes(account);
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
    library: any,
    chainId: number,
    account: string,
): Promise<BigNumber | null> {
    const stakes = await getAccountStakes(library, chainId, account);
    return sumActiveAccountStakes(stakes);
}

export async function getRewardsBalance(
    library: any,
    chainId: number,
    account: string,
): Promise<BigNumber | null> {
    try {
        if (chainHasStakesReporter(chainId)) {
            return await getRewardsBalanceFromReporter(
                library,
                chainId,
                account,
            );
        } else {
            if (hasContract(ContractName.STAKE_REWARD_CONTROLLER_2, chainId)) {
                const stakeRewardController2 =
                    getStakeRewardController2Contract(library, chainId);
                console.debug(
                    `Using StakeRewardController2.entitled() ` +
                        `at ${stakeRewardController2.address}`,
                );
                return await stakeRewardController2.entitled(account);
            } else {
                console.debug(
                    'Falling back to (probably buggy) RewardMaster.entitled()',
                );
                const rewardMaster = getRewardMasterContract(library, chainId);
                return await rewardMaster.entitled(account);
            }
        }
    } catch (err: any) {
        console.warn(`Failed to fetch rewards entitled for ${account}:`, err);
        return err;
    }
}

export interface StakeRow {
    id: number;
    stakeType: string;
    stakedAt: number;
    amount: BigNumber;
    reward: StakeRewardBN;
    lockedTill: number;
    unstakable?: boolean;
    claimedAt: number;
}

export async function getStakesAndRewards(
    library: any,
    chainId: number,
    account: string,
): Promise<[totalStaked: BigNumber, rows: StakeRow[]]> {
    const rewardsBalance = await getRewardsBalance(library, chainId, account);

    if (chainHasStakesReporter(chainId)) {
        const stakes = await getStakesInfoFromReporter(
            library,
            chainId,
            account,
        );
        const totalStaked = sumActiveAccountStakes(stakes[0]);
        const rewards = stakes[1];
        return [
            totalStaked,
            stakes[0].map(
                (stake: IStakingTypes.StakeStructOutput, i: number) => {
                    return {
                        ...stake,
                        reward: calculateRewardsForStake(
                            stake,
                            rewardsBalance,
                            totalStaked,
                            rewards[i],
                        ),
                    };
                },
            ),
        ];
    }

    // If we don't have StakesReporter, we have to calculate rewards per stake
    // proportionally based on total reward balance.
    const stakes = await getAccountStakes(library, chainId, account);
    const totalStaked = sumActiveAccountStakes(stakes);
    if (!rewardsBalance) return [totalStaked, []];
    return [
        totalStaked,
        stakes.map(stake => {
            return {
                ...stake,
                reward: calculateRewardsForStake(
                    stake,
                    rewardsBalance,
                    totalStaked,
                    null,
                ),
            };
        }),
    ];
}

export async function getStakesInfoFromReporter(
    library: any,
    chainId: number,
    account: string,
): Promise<[IStakingTypes.StakeStructOutput[], BigNumber[]]> {
    const stakesReporterContract = getStakesReporterContract(library, chainId);
    return await stakesReporterContract.getStakesInfo(account);
}

async function getRewardsBalanceFromReporter(
    library: any,
    chainId: number,
    account: string,
): Promise<BigNumber> {
    const stakesInfo = await getStakesInfoFromReporter(
        library,
        chainId,
        account,
    );
    const totalRewards = stakesInfo[1].reduce(
        (acc, reward) => acc.add(reward),
        constants.Zero,
    );
    return totalRewards;
}

export async function getTotalStaked(
    library: any,
    chainId: number,
): Promise<BigNumber> {
    const contract = getStakingContract(library, chainId);
    try {
        return await contract.totalStaked();
    } catch (err: any) {
        console.warn('Failed to fetch totalStaked from Staking contract:', err);
        return err;
    }
}

export async function getZKPMarketPrice(): Promise<BigNumber | null> {
    const symbol = env.TOKEN_SYMBOL;
    if (!symbol || symbol === 'none') {
        return null;
    }

    let priceData: any;
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
    const price = utils.parseUnits(String(priceData.data[symbol]['usd']), 18);
    return price;
}

export async function getStakingTermsFromContract(
    library: any,
    chainId: number,
    stakeType: StakeTypes,
): Promise<IStakingTypes.TermsStructOutput> {
    const stakingContract = getStakingContract(library, chainId);
    const stakingTypeHex = utils.id(stakeType).slice(0, 10);
    return await stakingContract.terms(stakingTypeHex);
}
