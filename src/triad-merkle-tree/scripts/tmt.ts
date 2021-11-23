#!/usr/bin/env node

/* ========================================================================== */
/*                     Triad Merkle Tree generation script                    */
/* ========================================================================== */

/*
    This script generates and saves in the specified folder compressed Triad
    Merkle Tree. Script reads NewIdentity events in provided smart contract.

    Arguments:
    1. --network or -n address of the RPC
    2. --contract or -c address of the NewIdentityEmitter contract
    3. --path or -p path to the folder where the compressed tree will be saved

    Output:
    - compressed tree in the specified folder:
        0_tree_compressed
        1_tree_compressed

*/

import CONSTANTS from '../constants';
import Utils from '../utils';
import {ethers} from 'ethers';
import fs from 'fs';
import yargs from 'yargs/yargs';

/* ------------------ specifies that arguments are expected ----------------- */
const argv = yargs(process.argv.slice(2))
    .usage('Usage: $0 <command> [options]')
    .command(
        'generate',
        'This script generates and saves in the specified folder compressed Triad Merkle Tree. Script reads NewIdentity events in provided smart contract.',
    )
    .example(
        '$0 generate -c 0x47576518f3Fbd15aFc4abbE35e699DdA477B9E17 -n http://127.0.0.1:8545 -p src/',
        'generates Triad Merkle Trees based on the events from this contract',
    )
    .option('network', {
        alias: 'n',
        type: 'string',
        description: 'specify network address',
        require: true,
    })
    .option('contract', {
        alias: 'c',
        type: 'string',
        description: 'specify contract address',
        require: true,
    })
    .option('path', {
        alias: 'p',
        type: 'string',
        description: 'specify location where to save the trees',
        require: false,
    })
    .help('h')
    .alias('h', 'help')
    .alias('v', 'version').argv;

/* ---------------------------- helper functions ---------------------------- */

// getting NewIdentity events and sorting in ascending order of leafId
const _fetchNewIdentityCommitments = async (
    network: string,
    contractAddress: string,
) => {
    const provider = new ethers.providers.JsonRpcProvider(network);
    const contract = new ethers.Contract(
        contractAddress,
        CONSTANTS.ABI,
        provider.getSigner(0),
    );

    const eventFilter = contract.filters.NewIdentity();
    const events = await contract.queryFilter(eventFilter);
    return events
        .filter(event => (event.event = 'NewIdentity'))
        .sort((a, b) =>
            BigInt(a.args?.leafId) > BigInt(b.args?.leafId) ? 1 : -1,
        )
        .map(event => event.args?.identityCommitment);
};

// saves the tree to the file
const _saveTree = (commitments: string[], treeIdx: number): void => {
    const tree = Utils.createTriadMerkleTree(commitments, BigInt(0));
    const w = Utils.stringifyTree(tree, true);
    let p: string;
    if (argv.path) {
        p = argv.path;
    } else {
        p = './';
    }
    fs.writeFileSync(`${p}/${treeIdx}_tmt_compressed`, w, 'ucs2');
};

// splits array into the chunks of the given size
const _splitArrayIntoChunksOfLen = (
    arr: Array<string>,
    len: number,
): Array<Array<string>> => {
    const chunks = [],
        n = arr.length;
    let i = 0;
    while (i < n) {
        chunks.push(arr.slice(i, (i += len)));
    }
    return chunks;
};

/* ------------------------------ main function ----------------------------- */

(async () => {
    const commitments = await _fetchNewIdentityCommitments(
        argv.network,
        argv.contract,
    );
    _splitArrayIntoChunksOfLen(commitments, CONSTANTS.TREE_SIZE).forEach(
        (chunk, treeIdx) => {
            _saveTree(chunk, treeIdx);
        },
    );
})();
