import {
    deriveKeypairFromSeed,
    // generateKeypair
} from './crypto';
import {IKeypair} from './types';

export default class Keychain {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {}

    generateRootSpendingKeypair = (seed: bigint): IKeypair => {
        return deriveKeypairFromSeed(seed);
    };

    generateRootReadingKeypair = (seed: bigint): IKeypair => {
        const readingKeys: IKeypair = deriveKeypairFromSeed(seed);
        if (!localStorage.getItem('rootReadingKey')) {
            localStorage.setItem(
                'rootReadingKey',
                JSON.stringify(
                    readingKeys,
                    (key, value) =>
                        typeof value === 'bigint' ? value.toString() : value, // return everything else unchanged
                ),
            );
        }
        return readingKeys;
    };
}

/* class Keypair {
    constructor(seed: IKeypair = generateKeypair()) {
    }
} */
