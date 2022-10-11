import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {ethers} from 'ethers';

function getContractEnvVariable(
    hre: HardhatRuntimeEnvironment,
    envWithoutNetworkSuffix: string,
) {
    return `${envWithoutNetworkSuffix}_${hre.network.name.toUpperCase()}`;
}

function getContractEnvAddress(
    hre: HardhatRuntimeEnvironment,
    envWithoutNetworkSuffix: string,
): string | undefined {
    const envKey = getContractEnvVariable(hre, envWithoutNetworkSuffix);
    const envValue = process.env[envKey];

    return envValue;
}

function reuseEnvAddress(
    hre: HardhatRuntimeEnvironment,
    envWithoutNetworkSuffix: string,
): boolean {
    const envKey = getContractEnvVariable(hre, envWithoutNetworkSuffix);
    const envValue = getContractEnvAddress(hre, envWithoutNetworkSuffix);
    let resue = false;

    if (
        envValue &&
        ethers.utils.isAddress(envValue) &&
        envValue !== ethers.constants.AddressZero
    ) {
        console.log(
            '\x1b[32m',
            `Skip deployment. Using ${envKey} env variable`,
            envValue,
            '\x1b[0m',
        );
        resue = true;
    }

    return resue;
}

async function getContractAddress(
    hre: HardhatRuntimeEnvironment,
    contractName: string,
    envWithoutNetworkSuffix: string,
): Promise<string> {
    const contractAddress = getContractEnvAddress(hre, envWithoutNetworkSuffix);
    const contractAddressEnvVariable = getContractEnvVariable(
        hre,
        envWithoutNetworkSuffix,
    );

    try {
        return (
            contractAddress ||
            (await hre.ethers.getContract(contractName)).address
        );
    } catch (error: any) {
        console.log(
            '\x1b[31m',
            `Address for contract ${contractName} cannot be retrieved. Consider deploying a new version of this contract or adding a pre-deployed contract address in ${contractAddressEnvVariable} env variable`,
            '\x1b[0m',
        );

        throw new Error(error.message);
    }
}

export {reuseEnvAddress, getContractAddress, getContractEnvAddress};
