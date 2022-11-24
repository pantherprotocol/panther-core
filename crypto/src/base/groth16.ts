// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// The code is inspired by applied ZKP
import assert from 'assert';
import fs from 'fs';

import {poseidon} from 'circomlibjs';
import {ethers} from 'ethers';
import {ZqField} from 'ffjavascript';
import {groth16} from 'snarkjs';

import {
    TriadMerkleTree,
    generateMerkleProof,
    triadTreeMerkleProofToPathElements,
    triadTreeMerkleProofToPathIndices,
} from '../other/triad-merkle-tree';
import {bigIntToBuffer, bufferToBigInt} from '../utils/bigint-conversions';

import {sha256} from './hashes';
import {builder} from './witness-calculator';

export {groth16} from 'snarkjs';
export type PackedProof = {a: any; b: any; c: any; inputs: any};
export type FullProof = {proof: any; publicSignals: any};
export const SNARK_FIELD_SIZE = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617',
);
export const Fq = new ZqField(SNARK_FIELD_SIZE);

export const MINT_MSG_TYPE = [
    {name: 'to', type: 'address'},
    {name: 'nullifier', type: 'bytes32'},
    {name: 'root', type: 'bytes32'},
    {name: 'treeId', type: 'uint32'},
    {name: 'proof', type: 'bytes'},
    {name: 'deadline', type: 'uint256'},
];

export type Groth16Input = {
    publicInputsHash: bigint;
    data: bigint; // [message, treeID, externalNullifier]
    nullifier: any;
    root: bigint;
    secrets: SecretPair;
    pathElements: bigint[];
    pathIndices: any[];
};

// bytes4(keccak256('PreZkp'))
const EXTERNAL_NULLIFIER = BigInt('0x4da08cc7');

export type SecretPair = [bigint, bigint];
export const extractSecretsPair = (
    secrets: string,
): [r: string, s: string] | null => {
    if (!secrets) {
        return null;
    }
    if (secrets.length !== 132) {
        console.error(
            `Tried to create identity commitment from secrets of length '${secrets.length}'`,
        );
        return null;
    }
    if (secrets.slice(0, 2) !== '0x') {
        console.error(
            `Tried to create identity commitment from secrets without 0x prefix`,
        );
        return null;
    }
    // We will never verify this signature; we're only using it as a
    // deterministic source of entropy which can be used in a ZK proof.
    // So we can discard the LSB v which has the least entropy.
    const r = secrets.slice(2, 66);
    const s = secrets.slice(66, 130);
    return [r, s];
};

export function convertToSecretPair(s: string): SecretPair {
    return [
        BigInt('0x' + s.slice(2, 66)) % SNARK_FIELD_SIZE,
        BigInt('0x' + s.slice(66, 130)) % SNARK_FIELD_SIZE,
    ];
}

export const preparePublicInput = (
    secrets: SecretPair,
    root: bigint,
    treeId: number,
    message: bigint,
    externalNullifier: bigint,
): {nullifier: bigint; publicInputsHash: bigint; packedPubData: bigint} => {
    assert(treeId < 0xffffffff, 'Too big treeId');
    assert(
        externalNullifier <= BigInt('0xFFFFFFFF'),
        'Too big externalNullifier',
    );
    assert(
        message <= BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'),
        'Too big message',
    );

    const externalAndTree = (externalNullifier << BigInt(32)) + BigInt(treeId);
    const packedPubData = (externalAndTree << BigInt(160)) + message;

    const nullifier = poseidon([secrets[0], externalAndTree]);

    const publicInputsHash =
        bufferToBigInt(
            sha256(
                Buffer.concat([
                    bigIntToBuffer(packedPubData),
                    bigIntToBuffer(nullifier),
                    bigIntToBuffer(root),
                ]),
            ),
        ) % SNARK_FIELD_SIZE;

    return {
        nullifier,
        publicInputsHash,
        packedPubData,
    };
};

export async function generateProofWithWitnessBuffer(
    witnessBuffer: ArrayBuffer,
    zkey: any,
): Promise<FullProof> {
    const {proof, publicSignals} = await groth16.prove(
        zkey,
        witnessBuffer,
        null,
    );

    return {proof, publicSignals};
}

export async function calculateWitnessBuffer(
    input: Groth16Input,
    wasmBuffer: any,
): Promise<ArrayBuffer> {
    const witnessCalculator = await builder(wasmBuffer);
    const buffer = await witnessCalculator.calculateWTNSBin(input, 0);
    return buffer;
}

export async function generateSignature(
    to: string,
    nullifier: string,
    root: string,
    treeId: number,
    proof: string,
    deadline: number,
    signer: any,
    chainId: number,
    minterAddress: string,
) {
    const mintMessage = {
        to,
        nullifier,
        root,
        treeId,
        proof,
        deadline,
    };

    const Eip712Domain = {
        name: 'PreZKP minter',
        version: '1',
        chainId,
        verifyingContract: minterAddress,
    };
    console.debug('Eip712Domain:', Eip712Domain);

    const types = {Mint: MINT_MSG_TYPE};
    console.debug('EIP712 types:', types);
    console.debug('signing mint message:', mintMessage);

    const signature = await signer._signTypedData(
        Eip712Domain,
        types,
        mintMessage,
    );

    assert(
        ethers.utils.verifyTypedData(
            Eip712Domain,
            {Mint: MINT_MSG_TYPE},
            mintMessage,
            signature,
        ) == to,
    );

    return signature;
}

export async function generateProofWithBuffer(
    witnessBuffer: ArrayBuffer,
    zkey: any,
) {
    const fullProof = await generateProofWithWitnessBuffer(witnessBuffer, zkey);

    const proof = ethers.utils.defaultAbiCoder.encode(
        ['tuple(uint256[2] a,uint256[2][2] b,uint256[2] c,uint256[1] inputs)'],
        [packToSolidityProof(fullProof)],
    );
    return {fullProof, proof};
}

export const generateProofWithFiles = async (
    grothInput: Groth16Input,
    wasmFilePath: string,
    finalZkeyPath: string,
): Promise<FullProof> => {
    await genWnts(grothInput, wasmFilePath, 'witness.wtns');
    const {proof, publicSignals} = await groth16.prove(
        finalZkeyPath,
        'witness.wtns',
        null,
    );
    const exists = fs.existsSync('witness.wtns');
    if (exists) fs.unlinkSync('witness.wtns');
    return {proof, publicSignals};
};

const genWnts = async (
    input: Groth16Input,
    wasmFilePath: string,
    witnessFileName: string,
) => {
    const buffer = fs.readFileSync(wasmFilePath);
    return new Promise((resolve, reject) => {
        builder(buffer)
            .then(async witnessCalculator => {
                const buff = await witnessCalculator.calculateWTNSBin(input, 0);
                fs.writeFileSync(witnessFileName, buff);
                resolve(buff);
            })
            .catch(error => {
                reject(error);
            });
    });
};

export const packToSolidityProof = (fullProof: any): PackedProof => {
    const {proof, publicSignals} = fullProof;
    const replica = JSON.parse(JSON.stringify(proof)); // deep copy

    return {
        a: replica.pi_a.slice(0, 2),
        b: replica.pi_b.map((x: any) => x.reverse()).slice(0, 2),
        c: replica.pi_c.slice(0, 2),
        inputs: publicSignals.map((x: any) => {
            x = BigInt(x);
            return (x % SNARK_FIELD_SIZE).toString();
        }),
    };
};

export const verifyProof = async (
    vKey: any,
    fullProof: FullProof,
    logger?: null,
) => {
    const {proof, publicSignals} = fullProof;
    console.debug(
        '[verifyProof] vKey:',
        vKey,
        '/ PublicSignals:',
        publicSignals,
        '/ proof:',
        proof,
    );
    return groth16.verify(vKey, publicSignals, proof, logger);
};

export async function generateProofFromBrowser(
    address: string,
    secrets: string,
    leafId: bigint,
    tree: TriadMerkleTree,
    wasmBuffer: any,
    zKeyBuffer: any,
): Promise<any> {
    console.debug(tree);

    if (!wasmBuffer) {
        return Promise.reject(new Error('WASM buffer is not provided'));
    }

    if (!zKeyBuffer) {
        return Promise.reject(new Error('Zkey buffer is not provided'));
    }

    const message = BigInt(address);
    const [merkleProof, treeId] = await generateMerkleProof(leafId, tree);
    const secretPair = convertToSecretPair(secrets);

    const {nullifier, publicInputsHash, packedPubData} = preparePublicInput(
        secretPair,
        merkleProof.root,
        treeId,
        message,
        EXTERNAL_NULLIFIER,
    );

    const witnessBuffer = await calculateWitnessBuffer(
        {
            publicInputsHash,
            data: packedPubData,
            nullifier,
            root: merkleProof.root,
            secrets: secretPair,
            pathElements: triadTreeMerkleProofToPathElements(merkleProof),
            pathIndices: triadTreeMerkleProofToPathIndices(merkleProof),
        },
        wasmBuffer,
    );

    const {fullProof, proof} = await generateProofWithBuffer(
        witnessBuffer,
        zKeyBuffer,
    );

    return {
        fullProof,
        proof,
        nullifier,
        root: merkleProof.root,
        treeId,
    };
}
