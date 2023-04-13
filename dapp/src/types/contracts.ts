import {RewardMaster} from 'contracts/RewardMaster';
import {Staking} from 'contracts/Staking';
import {Contract} from 'ethers';

export type PossiblyTypedContract = Contract | RewardMaster | Staking;

// MASP chain ID could be only on Polygon or Hardhat networks
export type MaspChainIds = 137 | 80_001 | 31_337;
