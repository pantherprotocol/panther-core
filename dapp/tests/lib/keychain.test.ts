import {describe, expect} from '@jest/globals';
import {babyjub} from 'circomlibjs';
import {Wallet} from 'ethers';

import {
    BN254_FIELD_SIZE,
    deriveKeypairFromSeed,
    deriveKeypairFromSignature,
    derivePrivateKeyFromSignature,
    extractSecretsPair,
    generatePublicKey,
    generateRandomBabyJubValue,
    isChildPubKeyValid,
    multiplyScalars,
} from '../../src/lib/keychain';

describe('Keychain', () => {
    const bigOne = BigInt(1);
    const randomAccount = Wallet.createRandom();
    let signature: string;

    beforeEach(async () => {
        const seedMsg = `I'm creating a Reading key for ${randomAccount.address}`;
        signature = await randomAccount.signMessage(seedMsg);
    });

    describe('Seed', () => {
        it('should be within BN254_FIELD_SIZE', () => {
            expect(
                derivePrivateKeyFromSignature(signature) < BN254_FIELD_SIZE,
            ).toBeTruthy();
        });
    });

    describe('Signature elements', () => {
        it('should be within BN254_FIELD_SIZE', () => {
            const [r, s] = extractSecretsPair(signature);
            expect(r < BN254_FIELD_SIZE).toBeTruthy();
            expect(s < BN254_FIELD_SIZE).toBeTruthy();
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
        it('should be smaller within babyjubjub and SNARK filed sizes, respectively', () => {
            const keypair = deriveKeypairFromSignature(signature);
            expect(keypair.privateKey < babyjub.subOrder).toBeTruthy();
            expect(keypair.publicKey[0] < BN254_FIELD_SIZE).toBeTruthy();
            expect(keypair.publicKey[1] < BN254_FIELD_SIZE).toBeTruthy();
        });

        it('should be deterministically generated', () => {
            const keypairOne = deriveKeypairFromSignature(signature);
            const keypairTwo = deriveKeypairFromSignature(signature);
            expect(keypairOne.privateKey).toEqual(keypairTwo.privateKey);
            expect(keypairOne.publicKey).toEqual(keypairTwo.publicKey);
        });
    });

    describe('Private and public key of random keypair', () => {
        it('should be smaller within babyjubjub and SNARK filed sizes, respectively', () => {
            const keypair = deriveKeypairFromSeed();
            expect(keypair.privateKey < babyjub.subOrder).toBeTruthy();
            expect(keypair.publicKey[0] < BN254_FIELD_SIZE).toBeTruthy();
            expect(keypair.publicKey[1] < BN254_FIELD_SIZE).toBeTruthy();
        });

        it('should not be deterministic', () => {
            const keypairOne = deriveKeypairFromSeed();
            const keypairTwo = deriveKeypairFromSeed();
            expect(keypairOne.privateKey).not.toEqual(keypairTwo.privateKey);
            expect(keypairOne.publicKey).not.toEqual(keypairTwo.publicKey);
        });
    });

    describe('Multiplication of private key', () => {
        const r = generateRandomBabyJubValue();
        const s = generateRandomBabyJubValue();
        const B = babyjub.Base8;
        const sB = babyjub.mulPointEscalar(B, s);
        const rB = babyjub.mulPointEscalar(B, r);
        const r_sB = babyjub.mulPointEscalar(sB, r);
        const s_rB = babyjub.mulPointEscalar(rB, s);

        const rs = multiplyScalars(r, s);
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
            describe('multiplication of scalars', () => {
                const r = generateRandomBabyJubValue();
                it('should throw error if scalar a is outside BabyJubJub', () => {
                    expect(() => multiplyScalars(BN254_FIELD_SIZE, r)).toThrow(
                        'Scalar a is not in the BabyJubJub field',
                    );
                });
                it('should throw error if scalar b is outside BabyJubJub', () => {
                    expect(() => multiplyScalars(r, BN254_FIELD_SIZE)).toThrow(
                        'Scalar b is not in the BabyJubJub field',
                    );
                });
            });
            it('should throw error during generation of public key', () => {
                expect(() => generatePublicKey(BN254_FIELD_SIZE)).toThrow(
                    'privateKey is not in the BabyJubJub field',
                );
            });
        });

        describe('Public key outside BN254 filed', () => {
            const r = generateRandomBabyJubValue();
            const pubKeyWithinSnark = [
                BN254_FIELD_SIZE - bigOne,
                BN254_FIELD_SIZE - bigOne,
            ];
            const pubKeyXNotWithinSnark = [
                BN254_FIELD_SIZE + bigOne,
                BN254_FIELD_SIZE - bigOne,
            ];
            const pubKeyYotWithinSnark = [
                BN254_FIELD_SIZE - bigOne,
                BN254_FIELD_SIZE + bigOne,
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
                                pubKeyYotWithinSnark,
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
        const rootKeypair = deriveKeypairFromSeed();
        const secret = generateRandomBabyJubValue();
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
