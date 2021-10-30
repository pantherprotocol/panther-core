import * as fs from 'fs'
import * as path from 'path'

import Web3 from 'web3'
import { poseidon } from 'circomlibjs'

const { keccak256, toBN } = Web3.utils

const genZerosContract = (zeroSeed: string, treeDepth: number): string => {

    const FIELD_NOTE = 'Order of alt_bn128 and the field prime of Baby Jubjub and Poseidon hash'
    const SCALAR_FIELD = '21888242871839275222246405745257275088548364400416034343698204186575808495617'

    const template = fs.readFileSync(
        path.join(
            __dirname,
            'TriadMerkleZeros.sol.template',
        ),
    ).toString()

    const zeroVal: string = toBN(keccak256(zeroSeed)).mod(toBN(SCALAR_FIELD)).toString()

    const zeros: BigInt[] = [BigInt(zeroVal)]

    // First level is modified (it has 3 child nodes)
    zeros[1] = poseidon([zeroVal, zeroVal, zeroVal])

    // Other levels are "binary"
    for (let i = 2; i <= treeDepth; i ++) {
        const z = zeros[i - 1]
        const hashed = poseidon([z, z])
        zeros.push(hashed)
    }

    let z = ''
    for (let i = 0; i < zeros.length - 1; i ++) {
        z += `        zeros[${i}] = bytes32(uint256(${zeros[i]}));\n`
    }

    return template
        .replace('<% NOTE %>', FIELD_NOTE)
        .replace('<% FIELD %>', SCALAR_FIELD)
        .replace('<% SEED %>', zeroSeed)
        .replace('<% ZERO %>', zeroVal)
        .replace('<% ROOT %>', zeros[treeDepth].toString())
        .replace('<% DEPTH %>', treeDepth.toString())
        .replace('<% LEVELS %>', (treeDepth + 1).toString())
        .replace('<% ZEROS %>', '        ' + z.trim())
}

if (require.main === module) {
    const zeroSeed = process.argv[2]
    const treeDepth = Number(process.argv[3])
    if (treeDepth > 32) throw "treeDepth can't exceed 32";

    const generated = genZerosContract(zeroSeed, treeDepth)
    console.log(generated)
}

export {
    genZerosContract,
}
