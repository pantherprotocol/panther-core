import * as fs from 'fs';
import * as path from 'path';

import Web3 from 'web3';
import { poseidon } from 'circomlibjs';

const { keccak256, toBN } = Web3.utils;

const genZerosContract = (zeroSeed: string, treeDepth: number): string => {
    // Defined in "../contracts/crypto/SnarkContracts.sol" as well
    const SCALAR_FIELD =
        '21888242871839275222246405745257275088548364400416034343698204186575808495617';

    const template = fs
        .readFileSync(path.join(__dirname, 'TriadMerkleZeros.sol.template'))
        .toString();

    const zeroVal = toBN(keccak256(zeroSeed)).mod(toBN(SCALAR_FIELD));

    const zeros = [zeroVal];

    // First level is modified (it has 3 child nodes)
    zeros[1] = poseidon([zeroVal, zeroVal, zeroVal]);

    // Other levels are "binary"
    for (let i = 2; i <= treeDepth; i++) {
        const z = zeros[i - 1];
        const hashed = poseidon([z, z]);
        zeros.push(hashed);
    }

    let z = '';
    for (let i = 0; i < zeros.length - 1; i++) {
        z += `        zeros[${i}] = bytes32(
            uint256(
                0x${zeros[i].toString(16)}
            )
        );
`;
    }

    return template
        .replace('<% SEED %>', zeroSeed)
        .replace('<% ZERO %>', '0x' + zeroVal.toString(16))
        .replace('<% ROOT %>', '0x' + zeros[treeDepth].toString(16))
        .replace('<% DEPTH %>', treeDepth.toString())
        .replace('<% ZEROS %>', '        ' + z.trim());
};

if (require.main === module) {
    const zeroSeed = process.argv[2];
    const treeDepth = Number(process.argv[3]);
    if (treeDepth > 32) throw "treeDepth can't exceed 32";

    const generated = genZerosContract(zeroSeed, treeDepth);
    console.log(generated);
}

export { genZerosContract };
