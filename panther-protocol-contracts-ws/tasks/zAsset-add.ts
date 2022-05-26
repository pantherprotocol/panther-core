import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { task, types } from 'hardhat/config';

const TASK_ZASSET_ADD = 'zasset:add';

task(TASK_ZASSET_ADD, 'Add a ZAsset to the panther pool')
    .addParam('token', 'Address of token', undefined, types.string)
    .addParam(
        'tokenType',
        '0 for ERC20, 0x10 for ERC721, 0x11 for ERC1155',
        '0',
        types.string,
    )
    .addParam('scale', 'Scale amount', '0', types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const zAsset = {
            _unused: 0,
            status: 1,
            tokenType: taskArgs.tokenType,
            scale: taskArgs.scale,
            token: taskArgs.token,
        };

        const pantherPool = await hre.ethers.getContract('PantherPoolV0');

        const tx = await pantherPool.addAsset(zAsset);

        const receipt = await tx.wait();
        console.log('transaction receipt:', receipt);
    });
