import assert from 'assert';
import crypto from 'crypto';
import {poseidon} from 'circomlibjs';

export const sha256 = (preimage: Buffer) => {
    return Buffer.from(
        crypto.createHash('sha256').update(preimage).digest('hex'),
        'hex',
    );
};

export const poseidon2or3 = (inputs: bigint[]): bigint => {
    assert(inputs.length === 3 || inputs.length === 2);
    return poseidon(inputs);
};
