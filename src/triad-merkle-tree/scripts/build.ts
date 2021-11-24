#!/usr/bin/env node

/* ========================================================================== */
/*                    Build Merkle Trees from commitments                     */
/* ========================================================================== */

/*
    This script generates and saves Triad Merkle Trees in from the json file of
    commitments. Script reads NewIdentity events in provided json file and form
    tree(s).

    Arguments:
    1. --file or -f path to the json file with the list of commitments
    2. --path or -p path to the folder where the tree will be saved in json fmt
    3. --verbose or -v prints the progress

    Output:
    - json file with the commitments in the specified folder:
        identities-tree-0.json
        identities-tree-1.json
        identities-tree-2.json

    Example:
    ts-node build.ts -f newIdentity.events.sample.json -v
*/

import CONSTANTS from '../constants';
import Utils from '../utils';
import _ from 'lodash';
import fs from 'fs';
import yargs from 'yargs/yargs';

/* ------------------ specifies that arguments are expected ----------------- */
const argv = yargs(process.argv.slice(2))
    .usage('Usage: $0 [options]')
    .example(
        '$0 -f committments.json -p ./',
        'fetches NewIdentity commitment events from the contract',
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
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'extra chatty',
        require: false,
    })
    .help('h')
    .alias('h', 'help').argv;

/* ---------------------------- helper functions ---------------------------- */
// saves the tree to the file
const _saveTree = (commitments: string[], treeIdx: number): void => {
    const tree = Utils.createTriadMerkleTree(10, commitments, BigInt(0));
    const p = argv.path ? argv.path : './';
    const fn = `${p}/identities-tree-${treeIdx}.json`.replace('//', '/');
    if (argv.verbose) console.log(`Saving ${treeIdx} tree to ${fn}`);
    tree.save(fn, false);
};

/* ------------------------------ main function ----------------------------- */
const fn = `${argv.file}`;
if (argv.verbose) console.log(`reading file ${fn}...`);
let commitments = JSON.parse(fs.readFileSync(fn, 'utf-8'));
if (argv.verbose) console.log(`found ${commitments.length} commitments...`);

commitments = commitments
    .sort((a: any, b: any) => (BigInt(a.leafId) > BigInt(b.leafId) ? 1 : -1))
    .map((c: any) => c.identityCommitment);

_.chunk(commitments, CONSTANTS.TREE_SIZE).forEach((chunk: any, i: number) => {
    _saveTree(chunk, i);
});
if (argv.verbose) console.log(`Done!`);
