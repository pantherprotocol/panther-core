# Advanced Staking: Building commitment tree

Just for advanced staking, we need to periodically build the MASP v0 Merkle tree
and make it available for download by the dApp, for users to be able to activate
the early redemption feature. The tree consists of the leaves of commitments
from NewCommitments events emitted by the PantherPool contract. To prepare for
building of the tress, first, we need to download the NewCommitments from the
PantherPool contract.

## 1. Download commitments

Download commitments with the hardhat task that fetches NewCommitments events
from the PantherPool contract. This task requires several input arguments:

Arguments:

- address - pool contract address;
- start - starting block number to look from;
- out - file to write to;
- chunks-prefix - prefix of files to write chunks to;
- end (optional) - ending block number to look to.

Output:

- JSON file with NewCommitmentLog[] in the specified file: commitmentsLog.json

Example:

    yarn hardhat commitments-list \
        --address 0x6B982bE424aEe27e0251eE81dA024Eb25C83C497 \
        --start 27072075 --out ../crypto/tmp/events \
        --chunks-prefix 2022-07-13 --network mumbai

## 2. Build the Merkle Tree

Build the tree by running the script in crypto folder that generates and saves
Merkle tree in from the JSON file. Script reads NewCommitmentLog[] in the
provided JSON file created in the first step and forms a tree.

Arguments:

- file or -f path to the JSON file with an array of NewCommitmentLog
- path or -p path to the folder where the tree will be saved in JSON format

Output:

- JSON file of the tree with the commitments in the specified folder:
  identities-tree-0.json

Example:

    yarn ts-node scripts/build-commitments-tree.ts -f commitmentsLog.json -p ./

## 3. Upload to S3

Upload the tree to the Panther Protocol S3 bucket (ask an admin if you do not
have permissions).
