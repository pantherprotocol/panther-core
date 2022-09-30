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
    pantherPoolV0: 'PantherPoolV0',
};

// importing the contract artifacts
function requireContractArtifacts(contract, network, env) {
    logInfo(
        `Getting artifacts of ${contract} ${
            env ? ` for ${env} env and ` : ''
        }on ${network} network...`,
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
    let template = fs
        .readFileSync(path.join(__dirname, 'subgraph.template.yaml'))
        .toString();

    for (const contract in Contract) {
        const {address, receipt} = getContractArtifacts(Contract[contract]);

        logInfo(`contract address: ${address}`);
        logInfo(`contract start block: ${receipt.blockNumber}`);

        template = template
            .replace(`<% ${Contract[contract]}_ADDRESS %>`, address)
            .replace(
                `<% ${Contract[contract]}_STARTBLOCK %>`,
                receipt.blockNumber.toString(),
            );
    }

    fs.writeFileSync(path.join(__dirname, 'subgraph.yaml'), template);
}

// copy contracts abi to the abis folder
function copyAbis() {
    logInfo('Copying abis to subgraph/abis ...');

    const abiDir = path.join(__dirname, 'abis');

    // Create abi directory if it does not exist
    if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir);
    }

    for (const contract in Contract) {
        let {abi} = getContractArtifacts(Contract[contract]);

        // Delete multi-dimensional array from panther pool ABI.
        // Github issue: https://github.com/graphprotocol/graph-cli/issues/342
        if (Contract.pantherPoolV0 === 'PantherPoolV0') {
            abi = abi.filter(el => el.name !== 'generateDeposits');
        }

        fs.writeFileSync(
            path.join(abiDir, `${Contract[contract]}.json`),
            JSON.stringify(abi),
        );
    }
}

if (require.main === module) {
    copyAbis();
    genSubgraphYaml();
}
