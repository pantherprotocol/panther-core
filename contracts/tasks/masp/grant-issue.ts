import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task, types} from 'hardhat/config';

const TASK_GRANT_ENABLE = 'grant:issue';

task(TASK_GRANT_ENABLE, 'Enable grant to curator')
    .addParam('curator', 'Address of curator')
    .addParam('type', 'Grant type', '0x31a180d4', types.string)
    .addParam('amount', 'PRP amount', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const [deployer] = await hre.ethers.getSigners();

        const PrpGrantorProxy = await hre.ethers.getContract(
            'PrpGrantor_Proxy',
        );
        const PrpGrantorImp = await hre.ethers.getContract(
            'PrpGrantor_Implementation',
        );

        const data = PrpGrantorImp.interface.encodeFunctionData(
            'issueOwnerGrant',
            [taskArgs.curator, taskArgs.amount],
        );

        const tx = await deployer.sendTransaction({
            to: PrpGrantorProxy.address,
            data,
        });

        const receipt = await tx.wait();
        console.log('transaction receipt:', receipt);
    });
