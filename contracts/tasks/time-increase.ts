import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task} from 'hardhat/config';

const TASK_TIME_TRAVEL = 'time:increase';

task(TASK_TIME_TRAVEL, 'time:increase on the blockchain')
    .addParam(
        'time',
        'Duration in seconds to increase the latest block timestamp',
    )
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const input = taskArgs.time;
        if (input.includes('+')) {
            const increaseTime = input.split('+')[1];
            await hre.ethers.provider.send('evm_increaseTime', [+increaseTime]);
            await hre.ethers.provider.send('evm_mine', []);
            const futureBlockNumber =
                await hre.ethers.provider.getBlockNumber();
            const futureBlock = await hre.ethers.provider.getBlock(
                futureBlockNumber,
            );
            const futureTimestamp = futureBlock.timestamp;
            console.log(`Future block timestamp ${futureTimestamp}`);
        } else {
            await hre.ethers.provider.send('evm_mine', [+input]);
            const futureBlockNumber =
                await hre.ethers.provider.getBlockNumber();
            const futureBlock = await hre.ethers.provider.getBlock(
                futureBlockNumber,
            );
            const futureTimestamp = futureBlock.timestamp;
            console.log(`Future block timestamp ${futureTimestamp}`);
        }
    });
