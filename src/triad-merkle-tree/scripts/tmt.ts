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

    Example:
    ts-node ./src/triad-merkle-tree/scripts/tmt.ts generate -c 0x47576518f3Fbd15aFc4abbE35e699DdA477B9E17 -n http://127.0.0.1:8545 -p src/ -v
*/

import CONSTANTS from '../constants';
import Utils from '../utils';
import _ from 'lodash';
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
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'detailed output',
        require: false,
    })
    .help('h')
    .alias('h', 'help').argv;

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
    const tree = Utils.createTriadMerkleTree(10, commitments, BigInt(0));
    const p = argv.path ? argv.path : './';
    const fn = `${p}/${treeIdx}_tmt_compressed`.replace('//', '/');
    if (argv.verbose) console.log(`Saving tree to ${fn}`);
    tree.save(fn, true);
};

/* ------------------------------ main function ----------------------------- */

(async () => {
    const commitments = await _fetchNewIdentityCommitments(
        argv.network,
        argv.contract,
    );
    _.chunk(commitments, CONSTANTS.TREE_SIZE).forEach((chunk, treeIdx) => {
        _saveTree(chunk, treeIdx);
    });
})();
