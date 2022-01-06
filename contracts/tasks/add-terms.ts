import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { BigNumber, utils } from 'ethers';
const toBN = (n: number): BigNumber => BigNumber.from(n);

import { TASK_ADD_TERMS } from './task-names';

task(TASK_ADD_TERMS, 'Adds terms to staking contract for classic staking')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {

        const staking = await hre.ethers.getContract('Staking');
        const terms = {
            isEnabled: true,
            isRewarded: true,
            minAmountScaled: utils.hexZeroPad('0x00', 32),
            maxAmountScaled: utils.hexZeroPad('0x00', 32),
            allowedSince: utils.hexZeroPad('0x00', 32),
            allowedTill: utils.hexZeroPad('0x00', 32),
            lockedTill: utils.hexZeroPad('0x00', 32),
            exactLockPeriod: utils.hexZeroPad('0x00', 32),
            minLockPeriod: utils.hexZeroPad('0x1E', 32),
        }
        const stakeType = '0x4ab0941a' // bytes4(keccak('classic'))

        const tx = await staking.addTerms(stakeType, terms);
        const receipt = await tx.wait();
        console.log('addTerms transaction receipt:', receipt);
    });