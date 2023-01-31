// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {deriveRootKeypairs} from '@panther-core/crypto/lib/panther/keys';
import {IKeypair} from '@panther-core/crypto/lib/types/keypair';
import {Signer} from 'ethers';
import {MultiError} from 'services/errors';

export async function generateRootKeypairs(
    signer: Signer,
): Promise<IKeypair[] | MultiError> {
    try {
        return await deriveRootKeypairs(signer);
    } catch (error) {
        return new MultiError(error);
    }
}
