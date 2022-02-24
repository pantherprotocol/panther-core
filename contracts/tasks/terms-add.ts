import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task, types} from 'hardhat/config';
import {utils} from 'ethers';

const TASK_TERMS_ADD = 'terms:add';

task(TASK_TERMS_ADD, 'Adds terms to staking contract for classic staking')
    .addOptionalParam(
        'rewarded',
        'Whether reward is enabled or not',
        true,
        types.boolean,
    )
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const staking = await hre.ethers.getContract('Staking');
        const terms = {
            isEnabled: true,
            isRewarded: taskArgs.rewarded,
            minAmountScaled: utils.hexZeroPad('0x00', 32),
            maxAmountScaled: utils.hexZeroPad('0x00', 32),
            allowedSince: utils.hexZeroPad('0x00', 32),
            allowedTill: utils.hexZeroPad('0x00', 32),
            lockedTill: utils.hexZeroPad('0x00', 32),
            exactLockPeriod: utils.hexZeroPad('0x00', 32),
            minLockPeriod: utils.hexZeroPad('0x1E', 32),
        };
        const stakeType = '0x4ab0941a'; // bytes4(keccak('classic'))

        const tx = await staking.addTerms(stakeType, terms);
        const receipt = await tx.wait();
        console.log('addTerms transaction receipt:', receipt);
    });
