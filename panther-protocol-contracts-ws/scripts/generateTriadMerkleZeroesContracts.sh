#!/bin/bash
set -e

cd "$(dirname "$0")"
cd ..
pwd

zeroSeed="Pantherprotocol"
# Number of levels with nodes/leaves "below" the tree root
# Also defined in Constants.sol
treeDepth="15"

node_modules/.bin/ts-node lib/triadMerkleZerosContractGenerator.ts \
  ${zeroSeed} \
  ${treeDepth} \
  > contracts/triadTree/TriadMerkleZeros.sol
