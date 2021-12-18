// @ts-ignore
import {bigIntToBuffer, bufferToBigInt, sha256} from './utils';

import {MerkleProof} from './triad-merkle-tree';
// @ts-ignore
import {ZqField} from 'ffjavascript';
import assert from 'assert';
import {builder} from './witness_calculator';
import {ethers} from 'ethers';
import fs from 'fs';
// @ts-ignore
import {groth16} from 'snarkjs';
// @ts-ignore
import {poseidon} from 'circomlibjs';

// @ts-ignore
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

export type SecretPair = [bigint, bigint];
export const extractSecretsPair = (secrets: string) => {
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
    zkeyUrl: string,
): Promise<FullProof> {
    const {proof, publicSignals} = await groth16.prove(
        zkeyUrl,
        witnessBuffer,
        null,
    );

    return {proof, publicSignals};
}

export async function calculateWitnessBuffer(
    input: Groth16Input,
    wasmBuffer: ArrayBuffer,
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
        chainId: process.env.CHAIN_ID,
        verifyingContract: process.env.MINTER_ADDRESS,
    };

    const signature = await signer._signTypedData(
        Eip712Domain,
        {Mint: MINT_MSG_TYPE},
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
    zkeyUrl: string,
) {
    const fullProof = await generateProofWithWitnessBuffer(
        witnessBuffer,
        zkeyUrl,
    );

    const proof = ethers.utils.defaultAbiCoder.encode(
        ['tuple(uint256[2] a,uint256[2][2] b,uint256[2] c,uint256[1] inputs)'],
        [packToSolidityProof(fullProof)],
    );
    return {fullProof, proof};
}

export const genProof = async (
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

// converts the Quad Leaf ID to Tree ID and Triad Leaf ID
export const leafIdToTreeIdAndTriadId = (leafId: BigInt): [number, number] => {
    const nLeafId = Number(leafId);
    const treeId = Math.floor(nLeafId / 2048);
    const triadId = (nLeafId % 2048) - Math.floor((nLeafId % 2048) / 4);
    return [treeId, triadId];
};

export function triadTreeMerkleProofToPathIndices({
    indices: input,
}: MerkleProof): number[] {
    // every output index must be one-bit signal (0 or 1 in the lower bit)
    // leaf level index in the `input` has two bits, ...
    // ... and it must be converted in two output signals
    return [input[0] % 2, input[0] >> 1].concat(
        input.slice(1), // for inner levels, inputs do not need conversion
    );
}

export const verifyProof = async (
    vKey: string,
    fullProof: any,
    logger?: null,
) => {
    const {proof, publicSignals} = fullProof;
    return groth16.verify(vKey, publicSignals, proof, logger);
};

export function triadTreeMerkleProofToPathElements({
    pathElements: input,
}: MerkleProof): bigint[] {
    // Output for every level must be a single element.
    // Leaf level input is an array of two elements,
    // it must be converted in two output elements.
    return input.flat(1);
}
