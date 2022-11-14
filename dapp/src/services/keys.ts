import {deriveRootKeypairs} from '@panther-core/crypto/lib/panther/keys';
import {IKeypair} from '@panther-core/crypto/lib/types/keypair';
import {Signer} from 'ethers';
import {parseTxErrorMessage} from 'services/errors';

export async function generateRootKeypairs(
    signer: Signer,
): Promise<IKeypair[] | Error> {
    try {
        return await deriveRootKeypairs(signer);
    } catch (error) {
        return new Error(parseTxErrorMessage(error));
    }
}
