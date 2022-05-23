import {utils} from 'ethers';

import {
    formatCurrency,
    formatEther,
    formatPercentage,
    getDecimalSeparator,
    safeParseUnits,
    _setLocale,
} from '../../src/utils/helpers';

describe('formatPercentage', () => {
    type TEST_CASE = [number, string, string];

    const TEST_CASES: TEST_CASE[] = [
        [0, '0.00%', '0,00%'],
        [0.09, '9.00%', '9,00%'],
        [0.098, '9.80%', '9,80%'],
        [0.0987, '9.87%', '9,87%'],
        [0.09876, '9.88%', '9,88%'],
        [0.09873, '9.87%', '9,87%'],
        [987.0987, '98,709.87%', '98.709,87%'],
        [987.09876, '98,709.88%', '98.709,88%'],
        [987.09873, '98,709.87%', '98.709,87%'],
    ];

    describe('for en locale', () => {
        beforeAll(() => {
            _setLocale('en');
        });

        for (const [input, expected] of TEST_CASES) {
            it(`formats ${input} as ${expected}`, () => {
                expect(formatPercentage(input)).toEqual(expected);
            });
        }
    });

    describe('for nl locale', () => {
        beforeAll(() => {
            _setLocale('nl');
        });

        for (const [input, , expected] of TEST_CASES) {
            it(`formats '${input}' as '${expected}'`, () => {
                expect(formatPercentage(input)).toEqual(expected);
            });
        }
    });
});

describe('getDecimalSeparator', () => {
    it('returns . for en locale', () => {
        _setLocale('en');
        expect(getDecimalSeparator()).toEqual('.');
    });

    it('returns , for nl locale', () => {
        _setLocale('nl');
        expect(getDecimalSeparator()).toEqual(',');
    });
});

describe('formatCurrency', () => {
    const TEST_CASES = [
        ['0', '0.000', '0,000', '0.00', '0'],
        ['7', '7.000', '7,000', '7.00', '7'],
        [
            '12345678',
            '12,345,678.000',
            '12.345.678,000',
            '12,345,678.00',
            '12,345,678',
        ],
        [
            '12345678.9',
            '12,345,678.900',
            '12.345.678,900',
            '12,345,678.90',
            '12,345,678',
        ],
        [
            '12345678.98',
            '12,345,678.980',
            '12.345.678,980',
            '12,345,678.98',
            '12,345,678',
        ],
        [
            '12345678.987',
            '12,345,678.987',
            '12.345.678,987',
            '12,345,678.98',
            '12,345,678',
        ],
        [
            '12345678.9876',
            '12,345,678.987',
            '12.345.678,987',
            '12,345,678.98',
            '12,345,678',
        ],
    ];

    describe('for en locale', () => {
        beforeAll(() => {
            _setLocale('en');
        });

        for (const [input, expected] of TEST_CASES) {
            it(`formats ${input} as ${expected}`, () => {
                expect(
                    formatCurrency(utils.parseUnits(input), {decimals: 3}),
                ).toEqual(expected);
            });
        }
    });

    describe('for nl locale', () => {
        beforeAll(() => {
            _setLocale('nl');
        });

        for (const [input, , expected] of TEST_CASES) {
            it(`formats '${input}' as '${expected}'`, () => {
                expect(
                    formatCurrency(utils.parseUnits(input), {decimals: 3}),
                ).toEqual(expected);
            });
        }
    });

    describe('with 2 decimals', () => {
        beforeAll(() => {
            _setLocale('en');
        });

        for (const [input, , , expected] of TEST_CASES) {
            it(`formats ${input} as ${expected}`, () => {
                expect(formatCurrency(utils.parseUnits(input))).toEqual(
                    expected,
                );
            });
        }
    });

    describe('with 0 decimals', () => {
        beforeAll(() => {
            _setLocale('en');
        });

        for (const [input, , , , expected] of TEST_CASES) {
            it(`formats ${input} as ${expected}`, () => {
                expect(
                    formatCurrency(utils.parseUnits(input), {decimals: 0}),
                ).toEqual(expected);
            });
        }
    });
});

describe('formatEther', () => {
    it('converts BigNumber to string', () => {
        const bn = utils.parseUnits('234');
        expect(formatEther(bn)).toEqual('234.0');
    });

    it('preserves null value', () => {
        expect(formatEther(null)).toEqual(null);
    });
});

describe('safeParseUnits', () => {
    it("parses '234'", () => {
        const bn = safeParseUnits('234');
        expect(formatEther(bn)).toEqual('234.0');
    });

    it("doesn't parse null", () => {
        const bn = safeParseUnits(null);
        expect(bn).toBeNull();
    });

    it("doesn't parse ''", () => {
        const bn = safeParseUnits('');
        expect(bn).toBeNull();
    });

    it("doesn't parse '234abc'", () => {
        const bn = safeParseUnits('234abc');
        expect(bn).toBeNull();
    });
});
