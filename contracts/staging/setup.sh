#!/bin/bash

# see ~/Panther/git/zkp-token/docs/staging/
# for setting up the token and vesting pools

cd ../zkp-staking/contracts
cp .env.staging .env
mv deployments/rinkeby{,.`fds -t`}

yarn deploy --network rinkeby
yarn hardhat etherscan-verify --network rinkeby

yarn hardhat terms:add --network rinkeby
yarn hardhat adviser:add --network rinkeby

# Init for 4 weeks
yarn hardhat rewardpool:init 12 2419200 --network rinkeby
