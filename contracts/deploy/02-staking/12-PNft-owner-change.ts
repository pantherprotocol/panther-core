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

    const oldOwner = await pNft.owner();
    if (oldOwner.toLowerCase() == advancedStakeRewardController.toLowerCase()) {
        console.log(
            `PNft owner is already set to: ${advancedStakeRewardController}`,
        );
    } else {
        console.log(
            `Transferring ownership of Pnft to ${advancedStakeRewardController}...`,
        );

        const signer = await ethers.getSigner(deployer);
        const tx = await pNft
            .connect(signer)
            .transferOwnership(advancedStakeRewardController);

        console.log('PNft owner is updated, tx: ', tx.hash);
    }
};

export default func;

func.tags = ['advanced-staking', 'pnft-owner'];
func.dependencies = [
    'check-params',
    'advanced-stake-reward-controller',
    'pnft',
];
