import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {verifyUserConsentOnProd} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {getNamedAccounts, ethers} = hre;
    const {deployer} = await getNamedAccounts();

    await verifyUserConsentOnProd(hre, deployer);

    const multisig =
        process.env.DAO_MULTISIG_ADDRESS ||
        (await getNamedAccounts()).multisig ||
        deployer;

    const pNft = await ethers.getContract('PNftToken');

    const oldOwner = await pNft.owner();
    if (oldOwner.toLowerCase() == multisig.toLowerCase()) {
        console.log(`PNft owner is already set to: ${multisig}`);
    } else {
        console.log(`Transferring ownership of Pnft to ${multisig}...`);

        const signer = await ethers.getSigner(deployer);
        const tx = await pNft.connect(signer).transferOwnership(multisig);

        console.log('PNft owner is updated, tx: ', tx.hash);
    }
};

export default func;

func.tags = ['advanced-staking', 'pnft-owner'];
func.dependencies = [
    'check-params',
    'advanced-stake-reward-controller',
    'pnft',
    'pnft-minter',
];
