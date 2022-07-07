import {JsonRpcSigner} from '@ethersproject/providers';
import {Contract} from 'ethers';

import {abi as ADVANCED_STAKE_REWARD_CONTROLLER_ABI} from '../abi/AdvancedStakeRewardController';
import {abi as FAUCET_ABI} from '../abi/Faucet';
import {abi as POOL_V0_ABI} from '../abi/PoolV0';
import {abi as PZKPTOKEN_ABI} from '../abi/PZkpToken';
import {abi as REWARD_MASTER_ABI} from '../abi/RewardMaster';
import {abi as STAKE_REWARD_CONTROLLER_2_ABI} from '../abi/StakeRewardController2';
import {abi as STAKES_REPORTER_ABI} from '../abi/StakesReporter';
import {abi as STAKING_ABI} from '../abi/Staking';
import {abi as ZKPTOKEN_ABI} from '../abi/ZKPToken';
import {AdvancedStakeRewardController} from '../types/contracts/AdvancedStakeRewardController';
import {RewardMaster} from '../types/contracts/RewardMaster';
import {StakeRewardController2} from '../types/contracts/StakeRewardController2';
import {StakesReporter} from '../types/contracts/StakesReporter';
import {Staking} from '../types/contracts/Staking';

import {env} from './env';

export enum ContractName {
    STAKING,
    STAKES_REPORTER,
    REWARD_MASTER,
    ADVANCED_STAKE_REWARD_CONTROLLER,
    STAKE_REWARD_CONTROLLER_2,
    STAKING_TOKEN,
    ZKP_TESTNET_TOKEN,
    FAUCET,
    POOL_V0,
}

export function getContractEnvVar(
    contractName: ContractName,
    chainId: number,
): string {
    return `${ContractName[contractName]}_CONTRACT_${chainId}`;
}

export function hasContract(
    contractName: ContractName,
    chainId: number,
): boolean {
    const varName = getContractEnvVar(contractName, chainId);
    return !!env[varName];
}

export function getContractAddress(
    contractName: ContractName,
    chainId: number,
): string {
    const varName = getContractEnvVar(contractName, chainId);
    const address = env[varName];
    if (!address) {
        throw `${varName} not defined`;
    }
    console.debug(`Resolved ${varName} as ${address}`);
    return address;
}

export function chainHasStakesReporter(chainId: number): boolean {
    return hasContract(ContractName.STAKES_REPORTER, chainId);
}

export function chainHasAdvancedStaking(chainId?: number): boolean {
    return env[`HAS_ADVANCED_STAKING_${chainId}`] === 'true';
}

export function getContractABI(
    contractName: ContractName,
    chainId: number,
): any {
    switch (contractName) {
        case ContractName.STAKING:
            return STAKING_ABI;
        case ContractName.REWARD_MASTER:
            return REWARD_MASTER_ABI;
        case ContractName.STAKE_REWARD_CONTROLLER_2:
            return STAKE_REWARD_CONTROLLER_2_ABI;
        case ContractName.ADVANCED_STAKE_REWARD_CONTROLLER:
            return ADVANCED_STAKE_REWARD_CONTROLLER_ABI;
        case ContractName.STAKES_REPORTER:
            return STAKES_REPORTER_ABI;
        case ContractName.FAUCET:
            return FAUCET_ABI;
        case ContractName.POOL_V0:
            return POOL_V0_ABI;
        case ContractName.STAKING_TOKEN:
            if ([1, 4, 31337].includes(chainId)) return ZKPTOKEN_ABI;
            if ([137, 80001].includes(chainId)) return PZKPTOKEN_ABI;
    }
    throw `Unsupported contract ${contractName} on chainId ${chainId}`;
}

export function getContract(
    contractName: ContractName,
    library: any,
    chainId: number,
): Contract {
    // FIXME: add cache
    const address = getContractAddress(contractName, chainId);
    const abi = getContractABI(contractName, chainId);
    return new Contract(address, abi, library);
}

export function getTokenContract(library: any, chainId: number): Contract {
    return getContract(ContractName.STAKING_TOKEN, library, chainId);
}

export function getStakingContract(library: any, chainId: number): Staking {
    return getContract(ContractName.STAKING, library, chainId) as Staking;
}

export function getFaucetContract(library: any, chainId: number): Contract {
    return getContract(ContractName.FAUCET, library, chainId);
}

export function getPoolContract(library: any, chainId: number): Contract {
    return getContract(ContractName.POOL_V0, library, chainId);
}

export function getStakesReporterContract(
    library: any,
    chainId: number,
): StakesReporter {
    return getContract(
        ContractName.STAKES_REPORTER,
        library,
        chainId,
    ) as StakesReporter;
}

export function getRewardMasterContract(
    library: any,
    chainId: number,
): RewardMaster {
    return getContract(
        ContractName.REWARD_MASTER,
        library,
        chainId,
    ) as RewardMaster;
}

export function getStakeRewardController2Contract(
    library: any,
    chainId: number,
): StakeRewardController2 {
    return getContract(
        ContractName.STAKE_REWARD_CONTROLLER_2,
        library,
        chainId,
    ) as StakeRewardController2;
}

export function getAdvancedStakeRewardControllerContract(
    library: any,
    chainId: number,
): AdvancedStakeRewardController {
    return getContract(
        ContractName.ADVANCED_STAKE_REWARD_CONTROLLER,
        library,
        chainId,
    ) as AdvancedStakeRewardController;
}

type PossiblyTypedContract = Contract | RewardMaster | Staking;

export function getSignableContract<ContractType extends PossiblyTypedContract>(
    library: any,
    chainId: number,
    account: string,
    contractGetter: (library: any, chainId: number) => ContractType,
): {signer: JsonRpcSigner; contract: ContractType} {
    const signer = library.getSigner(account).connectUnchecked();
    if (!signer) {
        throw 'undefined signer';
    }
    const contract = contractGetter(library, chainId).connect(
        signer,
    ) as ContractType;
    return {signer, contract};
}
