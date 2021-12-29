# Development guide

This doc explains how to set up a local development environment for
staking and rewards.

## Prerequisites

- Check out
  [`zkp-staking`](https://github.com/pantherprotocol/zkp-staking) and
  [`zkp-token`](https://github.com/pantherprotocol/zkp-token) repositories.

- Run `yarn` in both.

## Setting up a local blockchain

In `zkp-token`:

- `cp .env.example .env` if you don't already have a suitable `.env`.
- Run `yarn chain` to start a Hardhat Network node.

### Deploying ZKP token and related contracts

In another window, `cd` to the `zkp-token` repository, and run:

    yarn deploy --network localhost

In the output, you will see a list of addresses of deployed smart
contracts.  Make a note of the token contract address, which will
be shown on a line like this:

    Token instance deployed (0x5FbDB2315678afecb367f032d93F642f64180aa3)...

### Deploying staking contracts

Set an environment variable pointing to that ZKP token contract above,
e.g.:

    export STAKING_TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3

and set the owner of the staking contract to the default first Hardhat
signer:

    export STAKING_OWNER=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266

In `zkp-staking`, run:

    cd contracts
    yarn deploy --network localhost

Make a note of the address of the newly deployed `Staking.sol` contract.

## Setting up the frontend

- `cp .env.example .env` if you don't already have a suitable `.env`.

- Make sure that `STAKING_CONTRACT` is set to the address of the newly
  deployed `Staking.sol` contract from above.
