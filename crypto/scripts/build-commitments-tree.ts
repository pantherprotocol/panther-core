#!/usr/bin/env ts-node
/* ========================================================================== */
/*                    Build Merkle Trees from commitments                     */
/* ========================================================================== */

/*
    This script generates and saves Triad Merkle Trees in from the json file of
    commitments. Script reads NewCommitmentLog[] in provided json file and form
    tree.

    Arguments:
    1. --file or -f path to the json file with an array of NewCommitmentLog
    2. --path or -p path to the folder where the tree will be saved in json fmt

    Output:
    - json file of the tree with the commitments in the specified folder:
        identities-tree-0.json

    Example:

    yarn ts-node scripts/build-commitments-tree.ts \
         -f tmp/events/20220713-0x6B982bE424aEe27e0251eE81dA024Eb25C83C497-mumbai-full.json \
         -p ../dapp/public/
*/

import _ from 'lodash';
import {
    TriadMerkleTree,
    createTriadMerkleTree,
    toBytes32,
    readCommitmentsFromCommitmentLog,
} from '../src/triad-merkle-tree';
import yargs from 'yargs/yargs';

const TREE_DEPTH = 15;
const TREE_SIZE = 2 ** (TREE_DEPTH - 1) * 3;
const ZERO_VALUE =
    '0x667764c376602b72ef22218e1673c2cc8546201f9a77807570b3e5de137680d';

const argv = yargs(process.argv.slice(2))
    .usage('Usage: $0 [options]')
    .example(
        '$0 -f commitments.json -p ./',
        'creates Merkle Tree from commitments saved as NewCommitmentLog[] JSON',
    )
    .option('path', {
        alias: 'p',
        type: 'string',
        description: 'specify location where to save the trees',
        require: false,
    })
    .option('file', {
        alias: 'f',
        type: 'string',
        description:
            'specify location where json file with commitments is located',
        require: true,
    })
    .help('h')
    .alias('h', 'help').argv;

function saveTree(
    tree: TriadMerkleTree,
    treeIdx: number,
    savePath: string,
): void {
    const fn = `${savePath}/new-commitments-tree-${treeIdx}.json`.replace(
        '//',
        '/',
    );
    tree.save(fn, false);
    console.log(
        `built tree #${treeIdx} with root: ${toBytes32(
            tree.root,
        )}. Saved to ${fn}`,
    );
}

function main() {
    const fn = `${argv.file}`;
    const commitments = readCommitmentsFromCommitmentLog(fn);
    const path = argv.path ? argv.path : './';
    _.chunk(commitments, TREE_SIZE).forEach((chunk: any, i: number) => {
        const tree = createTriadMerkleTree(
            TREE_DEPTH,
            chunk,
            BigInt(ZERO_VALUE),
        );
        saveTree(tree, i, path);
    });
    console.log(`Done!`);
}

if (require.main === module) {
    main();
}
