import crypto from 'crypto';

export const sha256 = (preimage: Buffer) => {
    return Buffer.from(
        crypto.createHash('sha256').update(preimage).digest('hex'),
        'hex',
    );
};
