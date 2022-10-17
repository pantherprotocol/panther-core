import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {isLocal} from '../../lib/checkNetwork';

import {getContractEnvAddress} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {getNamedAccounts, network} = hre;

    process.env.FX_ROOT_MAINNET = '0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2';
    process.env.FX_ROOT_GOERLI = '0x3d1d3E34f7fB6D26245E6640E1c50710eFFf15bA';

    process.env.FX_CHILD_POLYGON = '0x8397259c983751DAf40400790063935a11afa28a';
    process.env.FX_CHILD_MUMBAI = '0xCf73231F28B7331BBe3124B907840A94851f9f11';

    console.log(`Deploying on ${network.name}...`);

    const {deployer} = await getNamedAccounts();
    if (!deployer) throw 'Err: deployer undefined';

    if (!getContractEnvAddress(hre, 'ZKP_TOKEN'))
        throw 'Undefined ZKP_TOKEN_ADDRESS';

    if (!isLocal(hre)) {
        if (!process.env.DAO_MULTISIG_ADDRESS)
            throw 'Undefined DAO_MULTISIG_ADDRESS';
    }
};

export default func;

func.tags = ['check-params'];
