// SPDX-License-Identifier: MIT
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { MockAmountConvertor } from '../../types';

const toBN = ethers.BigNumber.from;

describe('AmountConvertor', function () {
    let amountConvertor: MockAmountConvertor;

    before(async () => {
        const AmountConvertor = await ethers.getContractFactory(
            'MockAmountConvertor',
        );
        amountConvertor =
            (await AmountConvertor.deploy()) as MockAmountConvertor;
    });

    describe('internal internalScaleAmount', () => {
        const amount = toBN('1234567890123456789012');

        it('should not scale the amount when scale is 0', async () => {
            const { scaledAmount, change } =
                await amountConvertor.internalScaleAmount(amount, 0);
            expect(scaledAmount).to.be.eq(amount);
            expect(change).to.be.eq(0);
        });

        it('should divide the amount by 1e1 when scale is 1 ', async () => {
            const { scaledAmount, change } =
                await amountConvertor.internalScaleAmount(amount, 1);
            expect(scaledAmount).to.be.eq(amount.div(1e1));
            expect(change).to.be.eq(amount.mod(1e1));
        });

        it('should divide the amount by 1e2 when amount scale is 2 ', async () => {
            const { scaledAmount, change } =
                await amountConvertor.internalScaleAmount(amount, 2);
            expect(scaledAmount).to.be.eq(amount.div(1e2));
            expect(change).to.be.eq(amount.mod(1e2));
        });

        it('should divide the amount by 1e3 when amount scale is 3', async () => {
            const { scaledAmount, change } =
                await amountConvertor.internalScaleAmount(amount, 3);
            expect(scaledAmount).to.be.eq(amount.div(1e3));
            expect(change).to.be.eq(amount.mod(1e3));
        });

        it('should divide the amount by 1e6 when amount scale is 6', async () => {
            const { scaledAmount, change } =
                await amountConvertor.internalScaleAmount(amount, 6);
            expect(scaledAmount).to.be.eq(amount.div(1e6));
            expect(change).to.be.eq(amount.mod(1e6));
        });

        it('should divide the amount by 1e9 when amount scale is 9', async () => {
            const { scaledAmount, change } =
                await amountConvertor.internalScaleAmount(amount, 9);
            expect(scaledAmount).to.be.eq(amount.div(1e9));
            expect(change).to.be.eq(amount.mod(1e9));
        });

        it('should divide the amount by 1e12 when amount scale is 12', async () => {
            const { scaledAmount, change } =
                await amountConvertor.internalScaleAmount(amount, 12);
            expect(scaledAmount).to.be.eq(amount.div(1e12));
            expect(change).to.be.eq(amount.mod(1e12));
        });

        it('should divide the amount by 1e15 when amount scale is 15', async () => {
            const { scaledAmount, change } =
                await amountConvertor.internalScaleAmount(amount, 15);
            expect(scaledAmount).to.be.eq(amount.div(1e15));
            expect(change).to.be.eq(amount.mod(1e15));
        });

        it('should divide the amount by 1e21 when amount scale is 21', async () => {
            const { scaledAmount, change } =
                await amountConvertor.internalScaleAmount(amount, 21);
            expect(scaledAmount).to.be.eq(amount.div(toBN(10).pow(21)));
            expect(change).to.be.eq(amount.mod(toBN(10).pow(21)));
        });

        it('should return (0, 0) when amount is 0 and scale is 0 ', async () => {
            const { scaledAmount, change } =
                await amountConvertor.internalScaleAmount(0, 0);
            expect(scaledAmount).to.be.eq(0);
            expect(change).to.be.eq(0);
        });

        it('should return (0, 0) when amount is 0 and scale is 1 ', async () => {
            const { scaledAmount, change } =
                await amountConvertor.internalScaleAmount(0, 1);
            expect(scaledAmount).to.be.eq(0);
            expect(change).to.be.eq(0);
        });

        it('should return (0, 0) when amount is 0 and scale is 3 ', async () => {
            const { scaledAmount, change } =
                await amountConvertor.internalScaleAmount(0, 3);
            expect(scaledAmount).to.be.eq(0);
            expect(change).to.be.eq(0);
        });

        it('should return (0, 0) when amount is 0 and scale is 15 ', async () => {
            const { scaledAmount, change } =
                await amountConvertor.internalScaleAmount(0, 15);
            expect(scaledAmount).to.be.eq(0);
            expect(change).to.be.eq(0);
        });
    });

    describe('internal unscaleAmount', () => {
        it('should not unscale the amount when scale is 0', async () => {
            const amount = toBN('79228162514264337593543950335');
            expect(
                await amountConvertor.internalUnscaleAmount(amount, 0),
            ).to.be.eq(amount);
        });

        it('should multiple the amount by 1e1 when amount scale is 1 ', async () => {
            const amount = toBN('7922816251426433759354395033');
            expect(
                await amountConvertor.internalUnscaleAmount(amount, 1),
            ).to.be.eq(amount.mul(1e1));
        });

        it('should multiple the amount by 1e2 when amount scale is 2', async () => {
            const amount = toBN('792281625142643375935439503');
            expect(
                await amountConvertor.internalUnscaleAmount(amount, 2),
            ).to.be.eq(amount.mul(1e2));
        });

        it('should multiple the amount by 1e3 when amount scale is 3', async () => {
            const amount = toBN('79228162514264337593543950');
            expect(
                await amountConvertor.internalUnscaleAmount(amount, 3),
            ).to.be.eq(amount.mul(1e3));
        });

        it('should multiple the amount by 1e6 when amount scale is 6', async () => {
            const amount = toBN('79228162514264337593543');
            expect(
                await amountConvertor.internalUnscaleAmount(amount, 6),
            ).to.be.eq(amount.mul(1e6));
        });

        it('should multiple the amount by 1e9 when amount scale is 9', async () => {
            const amount = toBN('79228162514264337593');
            expect(
                await amountConvertor.internalUnscaleAmount(amount, 9),
            ).to.be.eq(amount.mul(1e9));
        });

        it('should multiple the amount by 1e12 when amount scale is 12', async () => {
            const amount = toBN('79228162514264337');
            expect(
                await amountConvertor.internalUnscaleAmount(amount, 12),
            ).to.be.eq(amount.mul(1e12));
        });

        it('should multiple the amount by 1e15 when amount scale is 15', async () => {
            const amount = toBN('79228162514264');
            expect(
                await amountConvertor.internalUnscaleAmount(amount, 15),
            ).to.be.eq(amount.mul(1e15));
        });

        it('should return 0 when scaled amount is 0 and scale is 0', async () => {
            expect(await amountConvertor.internalUnscaleAmount(0, 0)).to.be.eq(
                0,
            );
        });

        it('should return 0 when scaled amount is 0 and scale is 1', async () => {
            expect(await amountConvertor.internalUnscaleAmount(0, 1)).to.be.eq(
                0,
            );
        });

        it('should return 0 when scaled amount is 0 and scale is 15', async () => {
            expect(await amountConvertor.internalUnscaleAmount(0, 15)).to.be.eq(
                0,
            );
        });
    });
});
