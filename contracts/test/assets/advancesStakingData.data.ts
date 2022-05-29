import {utils} from 'ethers';

export const params = {
    // Public keys shall be within the snark field range
    pubSpendingKey0X:
        '0x3061000000000000000000000000000000000000000000000000000000001063',
    pubSpendingKey0Y:
        '0x1010000000000000000000000000000000000000000000000000000000000101',
    pubSpendingKey1X:
        '0x3062000000000000000000000000000000000000000000000000000000002063',
    pubSpendingKey1Y:
        '0x2020000000000000000000000000000000000000000000000000000000000202',
    pubSpendingKey2X:
        '0x3063000000000000000000000000000000000000000000000000000000003063',
    pubSpendingKey2Y:
        '0x3030000000000000000000000000000000000000000000000000000000000303',
    // Secrets shall not necessarily be within the snark field range
    secret00:
        '0xFFFE00000000000000000000000000066000000000000000000000000000FEEE',
    secret01:
        '0xFFFE00000000000000000000000000077000000000000000000000000000FEEE',
    secret02:
        '0xFFFE00000000000000000000000000088000000000000000000000000000FEEE',
    secret10:
        '0xFFFE00000000000000000000000000099000000000000000000000000000FEEE',
    secret11:
        '0xFFFE000000000000000000000000000AA000000000000000000000000000FEEE',
    secret12:
        '0xFFFE000000000000000000000000000BB000000000000000000000000000FEEE',
    secret20:
        '0xFFFE000000000000000000000000000CC000000000000000000000000000FEEE',
    secret21:
        '0xFFFE000000000000000000000000000DD000000000000000000000000000FEEE',
    secret22:
        '0xFFFE000000000000000000000000000EE000000000000000000000000000FEEE',
};

export const data = utils.hexConcat([
    zeroHexPad(params.pubSpendingKey0X, 32),
    zeroHexPad(params.pubSpendingKey0Y, 32),
    zeroHexPad(params.pubSpendingKey1X, 32),
    zeroHexPad(params.pubSpendingKey1Y, 32),
    zeroHexPad(params.pubSpendingKey2X, 32),
    zeroHexPad(params.pubSpendingKey2Y, 32),
    zeroHexPad(params.secret00, 32),
    zeroHexPad(params.secret01, 32),
    zeroHexPad(params.secret02, 32),
    zeroHexPad(params.secret10, 32),
    zeroHexPad(params.secret11, 32),
    zeroHexPad(params.secret12, 32),
    zeroHexPad(params.secret20, 32),
    zeroHexPad(params.secret21, 32),
    zeroHexPad(params.secret22, 32),
]);

export const depositFakeInput = {
    tokens: [
        '0x3F73371cFA58F338C479928AC7B4327478Cb859f',
        '0x077C5810582Cc0c9C18e3036796304F8b166edd6',
        '0x014FBCa6A9639aCb30749A10E9a8890aFE933bd2',
    ],
    // shall be within the snark field range
    tokenIds: [
        '0x1050000000000000000000000000000110000000000000000000000000000501',
        '0x2050000000000000000000000000000220000000000000000000000000000502',
        '0x3050000000000000000000000000000330000000000000000000000000000503',
    ],
    extAmounts: [
        // shall not exceed 2**96
        '0xc0fe1',
        '0xc0fe2',
        '0xc0fe3',
    ],
    pubSpendingKeys: [
        [params.pubSpendingKey0X, params.pubSpendingKey0Y],
        [params.pubSpendingKey1X, params.pubSpendingKey1Y],
        [params.pubSpendingKey2X, params.pubSpendingKey2Y],
    ],
    secrets: [
        [params.secret00, params.secret01, params.secret02],
        [params.secret10, params.secret11, params.secret12],
        [params.secret20, params.secret21, params.secret22],
    ],
};

export const utxoData = utils.hexConcat([
    '0xab', // UTXO_DATA_TYPE1
    zeroHexPad(depositFakeInput.secrets[0][0], 32),
    zeroHexPad(depositFakeInput.secrets[0][1], 32),
    zeroHexPad(depositFakeInput.secrets[0][2], 32),
    zeroHexPad(depositFakeInput.tokens[0], 20),
    zeroHexPad(depositFakeInput.extAmounts[0], 12),
    zeroHexPad(depositFakeInput.tokenIds[0], 32),

    '0xab',
    zeroHexPad(depositFakeInput.secrets[1][0], 32),
    zeroHexPad(depositFakeInput.secrets[1][1], 32),
    zeroHexPad(depositFakeInput.secrets[1][2], 32),
    zeroHexPad(depositFakeInput.tokens[1], 20),
    zeroHexPad(depositFakeInput.extAmounts[1], 12),
    zeroHexPad(depositFakeInput.tokenIds[1], 32),

    '0xab',
    zeroHexPad(depositFakeInput.secrets[2][0], 32),
    zeroHexPad(depositFakeInput.secrets[2][1], 32),
    zeroHexPad(depositFakeInput.secrets[2][2], 32),
    zeroHexPad(depositFakeInput.tokens[2], 20),
    zeroHexPad(depositFakeInput.extAmounts[2], 12),
    zeroHexPad(depositFakeInput.tokenIds[2], 32),
]);

function zeroHexPad(s: string, bytesNum: number): string {
    return utils.hexZeroPad(s, bytesNum);
}
