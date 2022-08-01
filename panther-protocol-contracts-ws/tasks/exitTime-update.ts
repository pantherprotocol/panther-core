import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { task } from 'hardhat/config';

const TASK_EXIT_TIME_UPDATE = 'exittime:update';

task(TASK_EXIT_TIME_UPDATE, 'Update the panther pool exit time')
    .addParam('time', 'The new exit time')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        if (+taskArgs.time === 0) throw new Error('Undefined exit time');

        const [deployer] = await hre.ethers.getSigners();
        const pantherPool = await hre.ethers.getContract('PantherPoolV0');

        const data = pantherPool.interface.encodeFunctionData(
            'updateExitTime',
            [taskArgs.time],
        );

        const tx = await deployer.sendTransaction({
            to: pantherPool.address,
            data,
        });

        const receipt = await tx.wait();
        console.log('transaction receipt:', receipt);
    });
