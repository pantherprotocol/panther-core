import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {
    verifyUserConsentOnProd,
    getContractAddress,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {getNamedAccounts, ethers} = hre;
    const {deployer} = await getNamedAccounts();

    await verifyUserConsentOnProd(hre, deployer);

    const advancedStakeRewardController = await getContractAddress(
        hre,
        'AdvancedStakeRewardController',
        'ADVANCED_STAKE_REWARD_CONTROLLER',
    );

    const pNft = await ethers.getContract('PNftToken');

    const oldMinter = await pNft.minter();
    if (
        oldMinter.toLowerCase() == advancedStakeRewardController.toLowerCase()
    ) {
        console.log(
            `PNft minter is already set to: ${advancedStakeRewardController}`,
        );
    } else {
        console.log(
            `Transferring minter of Pnft to ${advancedStakeRewardController}...`,
        );

        const multisig =
            process.env.DAO_MULTISIG_ADDRESS ||
            (await getNamedAccounts()).multisig ||
            deployer;

        const signer = await ethers.getSigner(multisig);
        const tx = await pNft
            .connect(signer)
            .setMinter(advancedStakeRewardController);

        console.log('PNft minter is updated, tx: ', tx.hash);
    }
};

export default func;

func.tags = ['advanced-staking', 'pnft-minter'];
func.dependencies = [
    'check-params',
    'advanced-stake-reward-controller',
    'pnft',
];
