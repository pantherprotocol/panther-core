#!/bin/bash

# Condensed version of docs/dev-guide.md

yarn chain

# zkp-token
yarn deploy --network localhost

cd ../panther-core/contracts
rm -rf deployments/localhost
yarn deploy --network localhost
REWARD_POOL=0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e

cd ../../zkp-token
yarn hardhat pool:add --owner $REWARD_POOL --network localhost
yarn hardhat pool:add --owner 0 --network localhost
# release tokens to stake
yarn hardhat pool:release 1 10000 --network localhost

cd ../panther-core/contracts
yarn hardhat terms:add --network localhost
yarn hardhat adviser:add --network localhost

yarn hardhat rewardpool:init 0 864000 --network localhost
