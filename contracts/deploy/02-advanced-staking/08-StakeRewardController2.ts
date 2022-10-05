import {utils} from 'ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (!process.env.DEPLOY_CLASSIC_STAKING) return;
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    await deploy('StakeRewardController2', {
        from: deployer,
        args: [
            process.env.DAO_MULTISIG_ADDRESS, // owner
            process.env.ZKP_TOKEN_ADDRESS,
            process.env.STAKING_CONTRACT,
            process.env.REWARD_MASTER,
            utils.parseEther(String(3.555666824442e6)),
        ],
        gasLimit: 1e6,
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
};
export default func;

func.tags = ['classic-staking', 'stake-reward-controller-2'];
