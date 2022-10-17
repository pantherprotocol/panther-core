import {babyjub} from 'circomlibjs';

import {SNARK_FIELD_SIZE} from '../base/field-operations';

export function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

export function assertInSnarkField(value: bigint, objectDescription: string) {
    assert(
        value < SNARK_FIELD_SIZE,
        `${objectDescription} is not in the BN254 field`,
    );
}

export function assertInBabyJubJubSubOrder(
    value: bigint,
    objectDescription: string,
) {
    assert(
        value < babyjub.subOrder,
        `${objectDescription} is not in the BabyJubJub suborder`,
    );
}
