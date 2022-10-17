import {describe, expect} from '@jest/globals';
import {BigNumber} from 'ethers';

import {sumBigNumbers} from '../../src/utils/numbers';

describe('sumBigNumbers function tests', () => {
    it('should return the sum of array items only if the items are of types : Bignumber, number or bigint', () => {
        const num = 1;
        const BigIntNum = BigInt(2);
        const BigNumberNum = BigNumber.from(3);
        const SUM = BigNumber.from(6);
        const sumBigNum = sumBigNumbers([num, BigIntNum, BigNumberNum]);

        expect(sumBigNum).toEqual(SUM);
    });

    it('should throw an error if receives invalid arg types', () => {
        const stringVar = 'text';
        const BigN2 = BigNumber.from(2);
        const BigN3 = BigNumber.from(3);
        expect(() => sumBigNumbers([stringVar, BigN2, BigN3])).toThrowError();
    });
});
