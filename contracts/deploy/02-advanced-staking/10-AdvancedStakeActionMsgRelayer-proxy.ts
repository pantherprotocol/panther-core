import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {name: network} = hre.network;
    if (
        // Deployment on these networks supported only
        network != 'polygon' &&
        network != 'mumbai'
    ) {
        console.log('Skip AdvancedStakeActionMsgRelayer_Proxy deployment...');
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

func.tags = ['bridge', 'msg-relayer-proxy'];
