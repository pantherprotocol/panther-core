import {describe, expect} from '@jest/globals';
import {parseTxErrorMessage} from '../lib/errors';

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

        it('should parse execution reverted error', () => {
            const example = {
                code: -32603,
                message: 'Internal JSON-RPC error.',
                data: {
                    code: 3,
                    message: 'execution reverted: High value',
                    data: '0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000a486967682076616c756500000000000000000000000000000000000000000000',
                },
                stack: '{\n  "code": -32603,\n  "message": "Internal JSON-RPC error.",\n  "data": {\n    "code": 3,\n    "message": "execution reverted: High value",\n    "data": "0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000a486967682076616c756500000000000000000000000000000000000000000000"\n  },\n  "stack": "Error: Internal JSON-RPC error.\\n    at new n (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-1.js:27:365128)\\n    at a (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-1.js:27:368078)\\n    at Object.internal (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-1.js:27:368688)\\n    at c (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/background-3.js:3:108855)\\n    at chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/background-3.js:3:109887\\n    at async chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-5.js:19:40881"\n}\n  at new n (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-1.js:27:365128)\n  at a (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-1.js:27:368078)\n  at Object.internal (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-1.js:27:368688)\n  at c (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/background-3.js:3:108855)\n  at chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/background-3.js:3:109887\n  at async chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-5.js:19:40881',
            };
            expect(parseTxErrorMessage(example)).toBe(
                'execution reverted: High value',
            );
        });
    });
});
