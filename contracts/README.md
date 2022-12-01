# Panther Protocol v0.5

This repository contains smart contracts, their corresponding deployment scripts, Hardhat configuration tasks, and unit tests.

## Test

You can run the full test suite with the following command:

    yarn compile && yarn test

## Production Deployment

[Production-Deployment-README](docs/Production-Deployment-README.md)

## Contract Verification

Make sure you have the contracts' artifacts inside the [`deployments/mainnet`](./deployments/mainnet) and [`deployments/polygon`](./deployments/polygon) directories.

First, you need to create an account in both the [Etherscan](https://etherscan.io) and the [Polygonscan](https://polygonscan.com) and get your API key to verify the contracts using hardhat.

Once you have your API keys, Follow these steps to verify the contracts:

Make sure you are inside the [`contracts`](./contracts) workspace. Execute the following command in the root directory to change your directory to the `contracts` workspace:

    cd ./contracts

Rename the [.env.example](./.env.example) to `.env`. Then, add your API key that you have got from the Etherscan to `ETHERSCAN_API_KEY` env variable.

Execute the following command to verify the contracts on the Ethereum Mainnet:

    yarn verify --network miannet

After verifying the contracts on the Ethereum Mainnet, update the `ETHERSCAN_API_KEY` env variable by replacing your Etherscan API key with the Polygonscan API key.

Then, execute the following command to verify the contracts on the Polygon:

    yarn verify --network polygon

**Note:** You do not need to verify the `PoseidonT3` and `PoseidonT4` contracts as we have deployed them based on their ABI, not their solidity code.

**Note:** If for some reason, the `yarn verify` command throws an error for any of the contracts (other that `PoseidonT3` and `PoseidonT4`), you have to try verifying them manually. In this case, you will need the contract address and its constructor parameters. You can open the artifacts of the contract (that is inside the [`deployments`](./deployments) folder) and look for `address` and `args` keys in order to get contract address and its constructor parameters respectively. Once you have them, you can execute this command to verify the contract:

    yarn hardhat verify <contract address> <constructor parameters separated by a space> --network <network name>

## Slither

    yarn slither
