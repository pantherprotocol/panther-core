const fs = require('fs');
const path = require('path');
const {config: dotenvConfig} = require('dotenv');

dotenvConfig({path: path.resolve(__dirname, './.env')});

// Logger functions to print colored messages
function logInfo(message) {
    console.log('\x1b[32m', `Info: ${message}`, '\x1b[0m');
}
function logWarning(message) {
    console.log('\x1b[33m', `Warning: ${message}`, '\x1b[0m');
}
function logError(message) {
    console.log('\x1b[31m', `Error: ${message}`, '\x1b[0m');
}

const Contract = {
    advancedStakeRewardController: 'AdvancedStakeRewardController',
};

// getting the panther pool address and start block from .env file
function getPantherPoolInfo() {
    let pantherPoolAddress = process.env.PANTHER_POOL_ADDRESS;
    let pantherPoolStartBlock = process.env.PANTHER_POOL_START_BLOCK;

    if (!pantherPoolAddress) {
        pantherPoolAddress = '0x0000000000000000000000000000000000000000';
        logWarning('panther pool address is not set, using zero address');
    }
    if (!pantherPoolStartBlock) {
        pantherPoolStartBlock = '0';
        logWarning('panther pool start block is not set, using 0 value');
    }

    logInfo(`Panther pool address: ${pantherPoolAddress}`);
    logInfo(`Panther pool start block: ${pantherPoolStartBlock}`);

    return {pantherPoolAddress, pantherPoolStartBlock};
}

// importing the contract artifacts
function requireContractArtifacts(contract, network, env) {
    logInfo(
        `Getting artifacts of ${contract} for ${env} env and ${network} network...`,
    );

    const deploymentPath = path.join(
        __dirname,
        '..',
        'contracts',
        'deployments',
    );

    let contractPath;

    if (env) {
        contractPath = path.join(
            deploymentPath,
            'ARCHIVE',
            env,
            network,
            `${contract}.json`,
        );
    } else {
        contractPath = path.join(deploymentPath, network, `${contract}.json`);
    }

    if (!fs.existsSync(contractPath)) {
        logError(
            `Artifacts of ${contract} not found for env ${env} and network ${network}`,
        );
        process.exit(1);
    }

    try {
        const artifacts = require(contractPath);
        return artifacts;
    } catch (error) {
        logError(`Failed to parse ${contractPath}:\n${error}`);
        process.exit(1);
    }
}

// Get and validate network name and environment name and get the artifacts based on network and environment
function getContractArtifacts(contract) {
    const [, , network, env] = process.argv;

    return requireContractArtifacts(contract, network, env);
}

// generate subgraph.yaml file
function genSubgraphYaml() {
    const {pantherPoolAddress, pantherPoolStartBlock} = getPantherPoolInfo();

    const {
        address: AdvancedStakeRewardControllerAddress,
        receipt: AdvancedStakeRewardControllerReceipt,
    } = getContractArtifacts(Contract.advancedStakeRewardController);

    logInfo(
        `AdvanceStakeRewardController address: ${AdvancedStakeRewardControllerAddress}`,
    );
    logInfo(
        `AdvanceStakeRewardController start block: ${AdvancedStakeRewardControllerReceipt.blockNumber}`,
    );

    const template = fs
        .readFileSync(path.join(__dirname, 'subgraph.template.yaml'))
        .toString();

    const finalResult = template
        .replace(
            '<% AdvancedStakeRewardController_ADDRESS %>',
            AdvancedStakeRewardControllerAddress,
        )
        .replace(
            '<% AdvancedStakeRewardController_STARTBLOCK %>',
            AdvancedStakeRewardControllerReceipt.blockNumber.toString(),
        )
        .replace('<% PantherPoolV0_ADDRESS %>', pantherPoolAddress)
        .replace('<% PantherPoolV0_STARTBLOCK %>', pantherPoolStartBlock);

    fs.writeFileSync(path.join(__dirname, 'subgraph.yaml'), finalResult);
}

// copy contracts abi to the abis folder
function copyAbis() {
    logInfo('Copying abis to subgraph/abis ...');

    const {abi: AdvancedStakeRewardControllerAbi} = getContractArtifacts(
        Contract.advancedStakeRewardController,
    );

    fs.writeFileSync(
        path.join(__dirname, 'abis', 'AdvancedStakeRewardController.json'),
        JSON.stringify(AdvancedStakeRewardControllerAbi),
    );
}

if (require.main === module) {
    copyAbis();
    genSubgraphYaml();
}
