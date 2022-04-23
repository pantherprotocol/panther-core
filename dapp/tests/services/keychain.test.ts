import {describe, expect} from '@jest/globals';
import {Wallet} from 'ethers';

import {
    deriveKeypairFromSignature,
    generateRandomBabyJubValue,
    SNARK_FIELD_SIZE,
} from '../../src/lib/keychain';
import {IKeypair} from '../../src/lib/types';
import {generateSpendingChildKeypair} from '../../src/services/keychain';

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
