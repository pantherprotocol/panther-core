import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task} from 'hardhat/config';

const TASK_TIME_TRAVEL = 'time:increase';

task(TASK_TIME_TRAVEL, 'time:increase on the blockchain')
    .addParam(
        'time',
        'Duration in seconds to increase the latest block timestamp',
    )
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const currentBlockNumber = await hre.ethers.provider.getBlockNumber();
        const blockBefore = await hre.ethers.provider.getBlock(
            currentBlockNumber,
        );
        const timestampBefore = blockBefore.timestamp;
        console.log(`Current block timestamp ${timestampBefore}`);
        await hre.ethers.provider.send('evm_mine', [
            timestampBefore + +taskArgs.time,
        ]);
        const futureBlockNumber = await hre.ethers.provider.getBlockNumber();
        const futureBlock = await hre.ethers.provider.getBlock(
            futureBlockNumber,
        );
        const futureTimestamp = futureBlock.timestamp;
        console.log(`Future block timestamp ${futureTimestamp}`);
    });
