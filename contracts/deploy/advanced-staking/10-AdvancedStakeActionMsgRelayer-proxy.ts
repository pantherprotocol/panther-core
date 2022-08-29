import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {name: network} = hre.network;
    if (
        !process.env.DEPLOY_BRIDGE ||
        // Deployment on these networks supported only
        (network != 'polygon' && network != 'mumbai')
    ) {
        console.log('Skip bridge deployment...');
        return;
    }

    const {
        deployments: {deploy},
        ethers,
        getNamedAccounts,
    } = hre;
    const {deployer} = await getNamedAccounts();

    await deploy('AdvancedStakeActionMsgRelayer_Proxy', {
        contract: 'EIP173Proxy',
        from: deployer,
        args: [
            ethers.constants.AddressZero, // implementation will be changed
            deployer,
            [], // data
        ],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['msg-relayer-proxy'];
