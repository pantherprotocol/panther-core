import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task} from 'hardhat/config';
import {isLocal} from '../../lib/hardhat';

const TASK_EXIT_TIME_UPDATE = 'exittime:update';

task(TASK_EXIT_TIME_UPDATE, 'Update the panther pool exit time')
    .addOptionalParam('time', 'The new exit time')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        let exitTime = taskArgs.time || process.env.POOL_EXIT_TIME;
        let exitDelay = taskArgs.time || process.env.POOL_EXIT_DELAY;
        if (isLocal(hre)) {
            if (+exitTime === 0) exitTime = Math.ceil(Date.now() / 1000) + 60;
            if (+exitDelay === 0) exitDelay = 60;
        }
        if (+exitTime === 0) throw new Error('Undefined exit time');
        if (+exitDelay === 0) throw new Error('Undefined exit delay');

        const [deployer] = await hre.ethers.getSigners();
        const pantherPool = await hre.ethers.getContract('PantherPoolV0');

        const data = pantherPool.interface.encodeFunctionData(
            'updateExitTimes',
            [exitTime, exitDelay],
        );

        const tx = await deployer.sendTransaction({
            to: pantherPool.address,
            data,
        });

        const receipt = await tx.wait();
        console.log('transaction receipt:', receipt);
    });
