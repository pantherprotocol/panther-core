import {RewardMaster} from 'contracts/RewardMaster';
import {Staking} from 'contracts/Staking';
import {Contract} from 'ethers';

export type PossiblyTypedContract = Contract | RewardMaster | Staking;
