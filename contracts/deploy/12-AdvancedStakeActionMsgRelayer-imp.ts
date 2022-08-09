import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {ethers} from 'hardhat';
import resources from './resources.json';

const getParams = async (network: string) => {
    const msgSender = process.env.ADVANCED_STAKE_REWARD_ADVISER_AND_MSG_SENDER;

    const rewardMaster = (await ethers.getContract('RewardMaster')).address;
    const fxChild =
        resources.addresses.fxChild[network as 'polygon' | 'mumbai'];

    return {
        msgSender,
        rewardMaster,
        fxChild,
    };
};

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
        getNamedAccounts,
    } = hre;
    const {deployer} = await getNamedAccounts();

    const {rewardMaster, msgSender, fxChild} = await getParams(network);

    if (!msgSender) {
        console.log(
            'msgSender is not defined, skip relayer implementation deployment...',
        );
        return;
    }

    console.log('deploying message relayer implementation...');

    console.log('rewardMaster', rewardMaster);
    console.log('msgSender', msgSender);
    console.log('fxChild', fxChild);

    await deploy('AdvancedStakeActionMsgRelayer_Implementation', {
        contract: 'AdvancedStakeActionMsgRelayer',
        from: deployer,
        args: [rewardMaster, msgSender, fxChild],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['msg-relayer-imp'];
func.dependencies = ['msg-relayer-proxy'];
