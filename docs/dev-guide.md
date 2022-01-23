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
contracts. Make sure your `.env` contains variable definitions which
match these addresses. The simplest way to achieve this is to perform
a fresh deployment on a newly started Hardhat Network node. In this
case the addresses will always be the same, so you can just copy the
definitions directly from `.env.example` without requiring further
modifications.

Otherwise you will have to make a note of the `ZKPToken` and
`VestingPools` contract addresses, which will be shown on lines like
this:

    Token instance deployed (0x5FbDB2315678afecb367f032d93F642f64180aa3)...

and then edit `.env` to point to the correct addresses.

### Deploying staking contracts

In `zkp-staking`, set up the environment variables:

    cd contracts
    cp .env.example .env

Ensure the `STAKING_TOKEN` variable is pointing to that same ZKP token
contract defined as `TOKEN_ADDRESS` in `zkp-token/.env` above, e.g.:

    STAKING_TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3

and set the owner of the staking contract to the default first Hardhat
signer:

    STAKING_OWNER=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266

Now run:

    cd contracts
    yarn deploy --network localhost

There is no need to take notes of the addresses of these newly
deployed contracts, because unlike with the `zkp-token` deployment,
they are automatically stored in `contracts/deployments` via
`hardhat-deploy`, which also makes them easily retrievable via extra
API methods.

For convenient reference, you can also list the contracts and their
deployed addresses via:

    yarn contracts

However, you will need the address of `RewardPool` in the next step.

## Seeding smart contracts with data

### Creating a vesting pool for `RewardPool` contract

Run the following command in the `zkp-token` repository, ensuring that
`$REWARD_POOL` refers to the address of the `RewardPool` contract,
either by setting the `REWARD_POOL` variable, or simply substituting
the address into the command:

    yarn hardhat pool:add $REWARD_POOL --network localhost

This will create a new pool with the `RewardPool` contract as its
owner.

Make a note of the pool id generated here. If you are starting from
scratch, it should be pool id 0 - the first pool (or "zeroth", to be
more precise).

### Creating vesting pools for staking users

In order to test staking, we need an account which has $ZKP tokens
available for staking.

Still in `zkp-token`, create a new vesting pool with the deployer
account as the owner, by running:

    yarn hardhat pool:add 0 --network localhost

Here the `0` refers to the first of 20 signers which Hardhat
automatically makes available via `hre.ethers.getSigners()`.

Since by default Hardhat tasks use the first of these 20 signers, for
simplicity you can use `0` as the value for `$OWNER` here, which will
result in the new pool being owned by the same account which deployed
all the contracts.

However if you want to test staking with multiple accounts, you can
also create pools for any of the other 19 Hardhat signers, by using an
integer from `0` to `19`, and then import the private keys into
Metamask for testing. (These private keys are shown when starting up
the node via `yarn chain`.)

For each pool that you generate here, make a note of the pool id and
which account owns it. If you started from scratch, it should be pool
id 1 (the second pool after the one created above for the `RewardPool`
contract), owned by the zeroth Hardhat signer.

Notice how in the previous `pool:add` command, we used a normal wallet
address as the parameter to specify the pool owner, but here we are
using an integer from `0` to `19`, which specifies the owner as one of
the signers in the array returned by `hre.ethers.getSigners()`.

### Releasing ZKP for staking

Now you can release some tokens from one of these vesting pools to its
owner via the `pool:release` Hardhat task, for example:

    yarn hardhat pool:release 1 1000 --network localhost

will release 1000 ZKP tokens from pool 1.

Currently this only works for pools owned by the Hardhat deployer
account (i.e. zeroth signer).

### Register the classic staking type

We need to call `addTerms()` on the `Staking` contract to register
the `classic` type of staking with appropriate terms. There is a Hardhat
task which makes this easy:

    yarn hardhat terms:add --network localhost

### Register the reward adviser for staking and unstaking

Next we need to register the `StakeRewardAdviser` contract as the reward
adviser for the `stake` and `unstake` actions of `classic` staking. Again
there is a Hardhat task for this:

    yarn hardhat adviser:add --network localhost

If this is not done, when attempting to stake you will get an `ACM:E4`
error. If it is done incorrectly, when attempting to stake the
transaction will revert with no error, as a result of trying to call
`getRewardAdvice()` on an address which does not implement the
`IRewardAdviser` interface.

### Initialize RewardPool

    yarn hardhat rewardpool:init $POOL_ID $DURATION --network localhost

where `$POOL_ID` is the index of the vesting pool created above, and
`$DURATION` is the period (in seconds) after initialization during
which vesting should be allowed.

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

## Checking smart contract test coverage

    cd ../contracts
    yarn coverage

Then open `coverage/index.html` in your browser.
