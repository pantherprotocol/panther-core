import {describe, expect} from '@jest/globals';

import {parseTxErrorMessage} from '../../src/utils/errors';

describe('Transaction error parsing', () => {
    beforeEach(() => {
        // ESLint Error: Unexpected empty arrow function
        // eslint-disable-next-line
        jest.spyOn(console, 'debug').mockImplementation((): void => {});
    });

    describe('parsing of ethjs errors', () => {
        it('should parse nonce has already been used error', () => {
            const example = {
                reason: 'nonce has already been used',
                code: 'NONCE_EXPIRED',
                error: {
                    code: -32603,
                    message:
                        '[ethjs-query] while formatting outputs from RPC \'{"value":{"code":-32603,"data":{"code":-32000,"message":"nonce too low"}}}\'',
                    stack: 'Error: [ethjs-query] while formatting outputs from RPC \'{"value":{"code":-32603,"data":{"code":-32000,"message":"nonce too low"}}}\'',
                },
                method: 'sendTransaction',
            };
            expect(parseTxErrorMessage(example)).toBe(
                'nonce has already been used',
            );
        });

        it('should parse nonce too high error', () => {
            const example = {
                code: -32603,
                message:
                    '[ethjs-query] while formatting outputs from RPC \'{"value":{"code":-32603,"data":{"code":-32000,"message":"Nonce too high. Expected nonce to be 18 but got 24. Note that transactions can\'t be queued when automining."}}}\'',
                stack: 'Error: [ethjs-query] while formatting outputs from RPC \'{"value":{"code":-32603,"data":{"code":-32000,"message":"Nonce too high. Expected nonce to be 18 but got 24. Note that transactions can\'t be queued when automining."}}}\'',
            };
            expect(parseTxErrorMessage(example)).toBe(
                "Nonce too high. Expected nonce to be 18 but got 24. Note that transactions can't be queued when automining.",
            );
        });

        it('should parse underpriced RPC error', () => {
            const example = {
                code: -32603,
                message:
                    '[ethjs-query] while formatting outputs from RPC \'{"value":{"code":-32603,"data":{"code":-32000,"message":"transaction underpriced"}}}\'',
                stack: 'Error: [ethjs-query] while formatting outputs from RPC \'{"value":{"code":-32603,"data":{"code":-32000,"message":"transaction underpriced"}}}\'',
            };

            expect(parseTxErrorMessage(example)).toBe(
                'transaction underpriced',
            );
        });

        it('should parse low gas RPC error', () => {
            const example = {
                code: -32603,
                message:
                    '[ethjs-query] while formatting outputs from RPC \'{"value":{"code":-32603,"data":{"code":-32000,"message":"Transaction requires at least 21740 gas but got 21000"}}}\'',
                stack: 'Error: [ethjs-query] while formatting outputs from RPC \'{"value":{"code":-32603,"data":{"code":-32000,"message":"Transaction requires at least 21740 gas but got 21000"}}}\'',
            };
            expect(parseTxErrorMessage(example)).toBe(
                'Transaction requires at least 21740 gas but got 21000',
            );
        });
    });
});
