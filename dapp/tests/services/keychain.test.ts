import {describe, expect} from '@jest/globals';
import {Wallet} from 'ethers';

import {
    deriveKeypairFromSignature,
    generateRandomBabyJubValue,
    BN254_FIELD_SIZE,
} from '../../src/lib/keychain';
import {IKeypair} from '../../src/lib/types';
import {
    deriveRootKeypairs,
    generateSpendingChildKeypair,
} from '../../src/services/keychain';

describe('Spending child keypair', () => {
    let spendingChildKeypair: IKeypair;
    let spendingRootKeypair: IKeypair;

    beforeAll(async () => {
        const randomAccount = Wallet.createRandom();
        const seedSpendingMsg = `I'm creating a spending root keypair for ${randomAccount.address}`;
        const spendingSignature = await randomAccount.signMessage(
            seedSpendingMsg,
        );
        spendingRootKeypair = deriveKeypairFromSignature(spendingSignature);

        const r = generateRandomBabyJubValue();
        spendingChildKeypair = generateSpendingChildKeypair(
            spendingRootKeypair.privateKey,
            r,
        );
    });

    it('should be defined', () => {
        expect(spendingChildKeypair.privateKey).toBeDefined();
        expect(spendingChildKeypair.publicKey).toBeDefined();
    });

    it('should be smaller than BN254_FIELD_SIZE', () => {
        expect(spendingChildKeypair.privateKey < BN254_FIELD_SIZE).toBeTruthy();
        expect(
            spendingChildKeypair.publicKey[0] < BN254_FIELD_SIZE,
        ).toBeTruthy();
        expect(
            spendingChildKeypair.publicKey[1] < BN254_FIELD_SIZE,
        ).toBeTruthy();
    });
});

describe('Keychain', () => {
    const randomAccount = Wallet.createRandom();

    describe('Root keypairs', () => {
        it('should be smaller than snark FIELD_SIZE', async () => {
            const keypairs: IKeypair[] = await deriveRootKeypairs(
                randomAccount,
            );
            expect(keypairs[0].privateKey < BN254_FIELD_SIZE).toBeTruthy();
            expect(keypairs[0].publicKey[0] < BN254_FIELD_SIZE).toBeTruthy();
            expect(keypairs[0].publicKey[1] < BN254_FIELD_SIZE).toBeTruthy();
            expect(keypairs[1].privateKey < BN254_FIELD_SIZE).toBeTruthy();
            expect(keypairs[1].publicKey[0] < BN254_FIELD_SIZE).toBeTruthy();
            expect(keypairs[1].publicKey[1] < BN254_FIELD_SIZE).toBeTruthy();
        });

        it('should be deterministic', async () => {
            const keypairsOne = await deriveRootKeypairs(randomAccount);
            const keypairsTwo = await deriveRootKeypairs(randomAccount);
            expect(keypairsOne[0].privateKey).toEqual(
                keypairsTwo[0].privateKey,
            );
            expect(keypairsOne[0].publicKey).toEqual(keypairsTwo[0].publicKey);
            expect(keypairsOne[1].privateKey).toEqual(
                keypairsTwo[1].privateKey,
            );
            expect(keypairsOne[1].publicKey).toEqual(keypairsTwo[1].publicKey);
        });
    });
});
