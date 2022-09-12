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
    .addParam(
        'zVersion',
        '0 for "default" zAsset, an integer in [1..31] for "alternative" zAsset of an ERC-20',
        '0',
        types.string,
    )
    .addParam('scale', 'Scale amount', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const zAsset = {
            _unused: 0,
            version: taskArgs.zVersion,
            status: 1,
            tokenType: taskArgs.tokenType,
            scale: taskArgs.scale,
            token: taskArgs.token,
        };

        const registry = await hre.ethers.getContract('ZAssetsRegistry');

        const tx = await registry.addZAsset(zAsset);

        const receipt = await tx.wait();
        console.log('transaction receipt:', receipt);
    });
