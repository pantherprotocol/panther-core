# Development guide

This doc explains how to set up a local development environment for
staking and rewards.

## Prerequisites

- Clone `zkp-staking` from [GitLab](https://gitlab.com/pantherprotocol/zkp-staking).

- Clone `zkp-token` from [GitHub](https://github.com/pantherprotocol/zkp-token)
  or [GitLab](https://gitlab.com/pantherprotocol/zkp-token).

- Run `yarn` in both.

## Setting up a local blockchain

In `zkp-token`:

- `cp .env.example .env` if you don't already have a suitable `.env`.
- Run `yarn chain` to start a Hardhat Network node.

### Deploying ZKP token and related contracts

In another window, `cd` to the `zkp-token` repository, and run:

    yarn deploy --network localhost

In the output, you will see a list of addresses of deployed smart
contracts. Make a note of the token contract address, which will
be shown on a line like this:

    Token instance deployed (0x5FbDB2315678afecb367f032d93F642f64180aa3)...

### Deploying staking contracts

In `zkp-staking`, set up the environment variables:

    cd ontracts
    cp .env.example .env

Ensure the `STAKING_TOKEN` variable is pointing to that ZKP token
contract above, e.g.:

    STAKING_TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3

and set the owner of the staking contract to the default first Hardhat
signer:

    STAKING_OWNER=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266

Now run:

    cd contracts
    yarn deploy:chain

There is no need to take notes of the addresses of the newly deployed
contracts, because they are automatically stored in
`contracts/deployments` via `hardhat-deploy`, which also makes them
easily accessible via extra API methods.

## Setting up the frontend

- `cd ../dapp`

- `cp .env.example .env` if you don't already have a suitable `.env`.

- Make sure that `STAKING_CONTRACT` is set to the address of the newly
  deployed `Staking.sol` contract from above, and similarly for
  `REWARDS_MASTER_CONTRACT`.

- `yarn start` to start the dApp in development mode, then visit
  http://localhost:3000.

## Interacting with the chain from the console

    yarn console

Now you can easily retrieve the deployed contracts, e.g.:

    master = await ethers.getContract('RewardMaster'); master.address
