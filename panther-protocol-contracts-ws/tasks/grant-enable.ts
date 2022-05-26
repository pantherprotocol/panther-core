import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { task, types } from 'hardhat/config';

const TASK_GRANT_ENABLE = 'grant:enable';

task(TASK_GRANT_ENABLE, 'Enable grant to curator')
    .addParam('curator', 'Address of curator')
    .addParam('type', 'Grant type', '0x31a180d4', types.string)
    .addParam('amount', 'PRP amount', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const pantherPool = await hre.ethers.getContract('PantherPoolV0');

        const tx = await pantherPool.enableGrants(
            taskArgs.curator,
            taskArgs.type,
            taskArgs.amount,
        );

        const receipt = await tx.wait();
        console.log('transaction receipt:', receipt);
    });
