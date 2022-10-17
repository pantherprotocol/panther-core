import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {ethers} from 'ethers';
import inq from 'inquirer';

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
    deploymentName: string,
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
            (await hre.ethers.getContract(deploymentName)).address
        );
    } catch (error: any) {
        console.log(
            '\x1b[31m',
            `Address for contract ${deploymentName} cannot be retrieved. Consider deploying a new version of this contract or adding a pre-deployed contract address in ${contractAddressEnvVariable} env variable`,
            '\x1b[0m',
        );

        throw new Error(error.message);
    }
}

async function upgradeEIP1967Proxy(
    hre: HardhatRuntimeEnvironment,
    signerAddress: string,
    proxyAddress: string,
    implementationAddress: string,
    contractNameForConsoleLogging = 'contract',
) {
    const {ethers} = hre;
    const eip1967ProxyAbi = [
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'newImplementation',
                    type: 'address',
                },
            ],
            name: 'upgradeTo',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
    ];

    const proxy = await ethers.getContractAt(eip1967ProxyAbi, proxyAddress);

    const response = await ethers.provider.send('eth_getStorageAt', [
        proxy.address,
        // EIP-1967 implementation slot
        '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
    ]);

    const oldImpl: string = ethers.utils.hexZeroPad(
        ethers.utils.hexStripZeros(response),
        20,
    );

    if (oldImpl == implementationAddress.toLowerCase()) {
        console.log(
            '\x1b[32m',
            `Skip upgrading ${contractNameForConsoleLogging}. Proxy ${proxy.address} already set to Implementation: ${implementationAddress}`,
            '\x1b[0m',
        );
        return;
    }

    console.log(
        `Upgrading ${contractNameForConsoleLogging} Proxy ${proxy.address} to new Implementation: ${implementationAddress}...`,
    );

    const signer = await ethers.getSigner(signerAddress);
    const tx = await proxy.connect(signer).upgradeTo(implementationAddress);
    console.log('Proxy is upgraded, tx: ', tx.hash);
}

async function verifyUserConsentOnProd(
    hre: HardhatRuntimeEnvironment,
    signer: string,
) {
    if (hre.network.name === 'mainnet' || hre.network.name === 'polygon') {
        console.log(
            '\x1b[32m',
            `Using signer ${signer} to deploy on ${hre.network.name} network...`,
            '\x1b[0m',
        );

        const answer = await inq.prompt({
            type: 'confirm',
            name: 'question',
            message: 'Continue deploying the contract?',
            default: false,
        });
        if (!answer.question) {
            throw new Error('Signer was not confirmed');
        }
    }
}

export {
    reuseEnvAddress,
    getContractAddress,
    getContractEnvAddress,
    verifyUserConsentOnProd,
    upgradeEIP1967Proxy,
};
