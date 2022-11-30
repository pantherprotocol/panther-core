import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {isProd} from '../../lib/checkNetwork';
import {
    verifyUserConsentOnProd,
    getContractAddress,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {getNamedAccounts, ethers} = hre;
    const {deployer} = await getNamedAccounts();

    if (isProd(hre)) return;

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

        const signer = await ethers.getSigner(deployer);

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
