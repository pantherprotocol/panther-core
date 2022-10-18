import {describe, expect} from '@jest/globals';
import {babyjub} from 'circomlibjs';
import {Wallet} from 'ethers';

import {
    generateRandomKeypair,
    derivePubKeyFromPrivKey,
    isChildPubKeyValid,
    deriveChildPrivKeyFromRootPrivKey,
} from '../../src/base/keypairs';

import {
    SNARK_FIELD_SIZE,
    generateRandomInBabyJubSubField,
} from '../../src/base/field-operations';

import {
    deriveKeypairFromSignature,
    derivePrivKeyFromSignature,
    extractSecretsPair,
} from '../../src/panther/keys';

describe('Keychain', () => {
    const bigOne = BigInt(1);
    const randomAccount = Wallet.createRandom();
    let signature: string;

    beforeEach(async () => {
        const seedMsg = `I'm creating a Reading key for ${randomAccount.address}`;
        signature = await randomAccount.signMessage(seedMsg);
    });

    describe('Seed', () => {
        it('should be within SNARK_FIELD_SIZE', () => {
            expect(
                derivePrivKeyFromSignature(signature) < SNARK_FIELD_SIZE,
            ).toBeTruthy();
        });
    });

    describe('Signature elements', () => {
        it('should be within SNARK_FIELD_SIZE', () => {
            const [r, s] = extractSecretsPair(signature);
            expect(r < SNARK_FIELD_SIZE).toBeTruthy();
            expect(s < SNARK_FIELD_SIZE).toBeTruthy();
        });

        it('should throw error if signature is not valid', () => {
            expect(() => extractSecretsPair('invalid signature')).toThrow(
                "Tried to create keypair from signature of length '17'",
            );
        });

        it('should throw error if signature is null', () => {
            expect(() => extractSecretsPair('')).toThrow(
                'Signature must be provided',
            );
        });

        it('should throw error if signature is not starting with 0x', () => {
            expect(() => extractSecretsPair('0'.repeat(132))).toThrow(
                'Tried to create keypair from signature without 0x prefix',
            );
        });
    });

    describe('Private and public key of keypair derived from signature', () => {
        it('should be smaller than babyJubJub and BN254 field sizes, respectively', () => {
            const keypair = deriveKeypairFromSignature(signature);
            expect(keypair.privateKey < babyjub.subOrder).toBeTruthy();
            expect(keypair.publicKey[0] < SNARK_FIELD_SIZE).toBeTruthy();
            expect(keypair.publicKey[1] < SNARK_FIELD_SIZE).toBeTruthy();
        });

        it('should be deterministically generated', () => {
            const keypairOne = deriveKeypairFromSignature(signature);
            const keypairTwo = deriveKeypairFromSignature(signature);
            expect(keypairOne.privateKey).toEqual(keypairTwo.privateKey);
            expect(keypairOne.publicKey).toEqual(keypairTwo.publicKey);
        });
    });

    describe('Private and public key of random keypair', () => {
        it('should be smaller than babyJubJub and BN254 field sizes, respectively', () => {
            const keypair = generateRandomKeypair();
            expect(keypair.privateKey < babyjub.subOrder).toBeTruthy();
            expect(keypair.publicKey[0] < SNARK_FIELD_SIZE).toBeTruthy();
            expect(keypair.publicKey[1] < SNARK_FIELD_SIZE).toBeTruthy();
        });

        it('should not be deterministic', () => {
            const keypairOne = generateRandomKeypair();
            const keypairTwo = generateRandomKeypair();
            expect(keypairOne.privateKey).not.toEqual(keypairTwo.privateKey);
            expect(keypairOne.publicKey).not.toEqual(keypairTwo.publicKey);
        });
    });

    describe('Multiplication of private key', () => {
        const r = generateRandomInBabyJubSubField();
        const s = generateRandomInBabyJubSubField();
        const B = babyjub.Base8;
        const sB = babyjub.mulPointEscalar(B, s);
        const rB = babyjub.mulPointEscalar(B, r);
        const r_sB = babyjub.mulPointEscalar(sB, r);
        const s_rB = babyjub.mulPointEscalar(rB, s);

        const rs = deriveChildPrivKeyFromRootPrivKey(r, s);
        const rs_B = babyjub.mulPointEscalar(B, rs);

        describe('should be associative', () => {
            it('(rs)B == r(sB)', () => {
                expect(rs_B[0].toString()).toEqual(r_sB[0].toString());
                expect(rs_B[1].toString()).toEqual(r_sB[1].toString());
            });

            it('(rs)B == s(rB)', () => {
                expect(rs_B[0].toString()).toEqual(s_rB[0].toString());
                expect(rs_B[1].toString()).toEqual(s_rB[1].toString());
            });

            it('r(sB) == s(rB)', () => {
                expect(s_rB[0].toString()).toEqual(r_sB[0].toString());
                expect(s_rB[1].toString()).toEqual(r_sB[1].toString());
            });
        });
    });

    describe('Check the field of definition', () => {
        describe('Private key outside babyjubjub filed', () => {
            describe('deriveChildPrivKeyFromRootPrivKey', () => {
                const r = generateRandomInBabyJubSubField();
                it('should throw error if rootPrivKey is outside BabyJubJub', () => {
                    expect(() =>
                        deriveChildPrivKeyFromRootPrivKey(SNARK_FIELD_SIZE, r),
                    ).toThrow(
                        'Root private key is not in the BabyJubJub suborder',
                    );
                });
                it('should throw error if random is outside BabyJubJub', () => {
                    expect(() =>
                        deriveChildPrivKeyFromRootPrivKey(r, SNARK_FIELD_SIZE),
                    ).toThrow('Random is not in the BabyJubJub suborder');
                });
            });
            it('should throw error during generation of public key', () => {
                expect(() => derivePubKeyFromPrivKey(SNARK_FIELD_SIZE)).toThrow(
                    'privateKey is not in the BabyJubJub suborder',
                );
            });
        });

        describe('Public key outside BN254 field', () => {
            const r = generateRandomInBabyJubSubField();
            const pubKeyWithinSnark = [
                SNARK_FIELD_SIZE - bigOne,
                SNARK_FIELD_SIZE - bigOne,
            ];
            const pubKeyXNotWithinSnark = [
                SNARK_FIELD_SIZE + bigOne,
                SNARK_FIELD_SIZE - bigOne,
            ];
            const pubKeyNotWithinSnark = [
                SNARK_FIELD_SIZE - bigOne,
                SNARK_FIELD_SIZE + bigOne,
            ];
            describe('validity check in isChildPubKeyValid()', () => {
                describe('Child public key', () => {
                    it('should throw error for X coordinate', () => {
                        expect(() =>
                            isChildPubKeyValid(
                                pubKeyXNotWithinSnark,
                                {privateKey: r, publicKey: pubKeyWithinSnark},
                                r,
                            ),
                        ).toThrow(
                            'Child public key X is not in the BN254 field',
                        );
                    });
                    it('should throw error for Y coordinate', () => {
                        expect(() =>
                            isChildPubKeyValid(
                                pubKeyNotWithinSnark,
                                {privateKey: r, publicKey: pubKeyWithinSnark},
                                r,
                            ),
                        ).toThrow(
                            'Child public key Y is not in the BN254 field',
                        );
                    });
                });

                describe('Root public key', () => {
                    it('should throw error for root', () => {
                        expect(() =>
                            isChildPubKeyValid(
                                pubKeyWithinSnark,
                                {
                                    privateKey: r,
                                    publicKey: pubKeyXNotWithinSnark,
                                },
                                r,
                            ),
                        ).toThrow(
                            'Root public key X is not in the BN254 field',
                        );
                    });
                });
            });
        });
    });
    describe('Validity check in generateChildPublicKey()', () => {
        const rootKeypair = generateRandomKeypair();
        const secret = generateRandomInBabyJubSubField();
        const validChildPubKey = babyjub.mulPointEscalar(
            rootKeypair.publicKey,
            secret,
        );
        const invalidChildPubKeyX = [
            validChildPubKey[0] + bigOne,
            validChildPubKey[1],
        ];
        const invalidChildPubKeyY = [
            validChildPubKey[0],
            validChildPubKey[1] + bigOne,
        ];

        describe('Child public key', () => {
            it('should return true if the key is valid', () => {
                expect(
                    isChildPubKeyValid(validChildPubKey, rootKeypair, secret),
                ).toBeTruthy();
            });

            it('should return false if X of the key is invalid', () => {
                expect(
                    isChildPubKeyValid(
                        invalidChildPubKeyX,
                        rootKeypair,
                        secret,
                    ),
                ).toBeFalsy();
            });
            it('should return false if Y of the key is invalid', () => {
                expect(
                    isChildPubKeyValid(
                        invalidChildPubKeyY,
                        rootKeypair,
                        secret,
                    ),
                ).toBeFalsy();
            });
        });
    });
});
