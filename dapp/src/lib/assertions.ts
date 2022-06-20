import {babyjub} from 'circomlibjs';

import {BN254_FIELD_SIZE} from './keychain';

export function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

export function assertInBN254Field(value: bigint, objectDescription: string) {
    assert(
        value < BN254_FIELD_SIZE,
        `${objectDescription} is not in the BN254 field`,
    );
}

export function assertInBabyJubJubField(
    value: bigint,
    objectDescription: string,
) {
    assert(
        value < babyjub.subOrder,
        `${objectDescription} is not in the BabyJubJub field`,
    );
}
