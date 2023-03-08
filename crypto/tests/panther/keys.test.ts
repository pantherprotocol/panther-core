import {describe, expect} from '@jest/globals';
import {Wallet} from 'ethers';

import {IKeypair} from '../../lib/types/keypair';
import {generateRandomInBabyJubSubField} from '../../src/base/field-operations';
import {
    deriveRootKeypairs,
    generateSpendingChildKeypair,
    deriveKeypairFromSignature,
} from '../../src/panther/keys';
import {SNARK_FIELD_SIZE} from '../../src/utils/constants';

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

        const r = generateRandomInBabyJubSubField();
        spendingChildKeypair = generateSpendingChildKeypair(
            spendingRootKeypair.privateKey,
            r,
        );
    });

    it('should be defined', () => {
        expect(spendingChildKeypair.privateKey).toBeDefined();
        expect(spendingChildKeypair.publicKey).toBeDefined();
    });

    it('should be smaller than SNARK_FIELD_SIZE', () => {
        expect(spendingChildKeypair.privateKey < SNARK_FIELD_SIZE).toBeTruthy();
        expect(
            spendingChildKeypair.publicKey[0] < SNARK_FIELD_SIZE,
        ).toBeTruthy();
        expect(
            spendingChildKeypair.publicKey[1] < SNARK_FIELD_SIZE,
        ).toBeTruthy();
    });
});

describe('Keychain', () => {
    const randomAccount = Wallet.createRandom();

    describe('Root keypairs', () => {
        it('should be smaller than snark FIELD_SIZE', async () => {
            const keypairs: IKeypair[] = (await deriveRootKeypairs(
                randomAccount,
            )) as IKeypair[];
            expect(keypairs[0].privateKey < SNARK_FIELD_SIZE).toBeTruthy();
            expect(keypairs[0].publicKey[0] < SNARK_FIELD_SIZE).toBeTruthy();
            expect(keypairs[0].publicKey[1] < SNARK_FIELD_SIZE).toBeTruthy();
            expect(keypairs[1].privateKey < SNARK_FIELD_SIZE).toBeTruthy();
            expect(keypairs[1].publicKey[0] < SNARK_FIELD_SIZE).toBeTruthy();
            expect(keypairs[1].publicKey[1] < SNARK_FIELD_SIZE).toBeTruthy();
        });

        it('should be deterministic', async () => {
            const keypairsOne = (await deriveRootKeypairs(
                randomAccount,
            )) as IKeypair[];
            const keypairsTwo = (await deriveRootKeypairs(
                randomAccount,
            )) as IKeypair[];
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
