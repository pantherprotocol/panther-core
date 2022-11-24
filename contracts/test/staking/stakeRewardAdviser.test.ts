import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

import {
    hash4bytes,
    classicActionHash,
    CLASSIC,
    STAKE,
    UNSTAKE,
} from '../../lib/hash';
import {StakeRewardAdviser} from '../../types/contracts';

describe('StakeRewardAdviser', () => {
    let stakeRewardAdviser: StakeRewardAdviser;
    let message: string;

    const stakeType = hash4bytes(CLASSIC);
    const STAKED = classicActionHash(STAKE);
    const UNSTAKED = classicActionHash(UNSTAKE);

    const stakeAmountToSharesScaledFactor = BigNumber.from(1e3);
    const scale = BigNumber.from(1e9); // hardcoded in the contract

    const stakeAmount = '0x0a0b0c0d0e0f000000ffffff';
    const staker = '0xc0fec0fec0fec0fec0fec0fec0fec0fec0fec0fe';

    const generateMessage = (address: string, amount: string) => {
        return (
            '0x' +
            address.replace('0x', '') + // staker
            amount.replace('0x', '') + // amount
            '0000002e' + // id
            '01324647' + // stakedAt
            '01324648' + // lockedTill
            '01324649' // claimedAt
        );
    };

    before(async () => {
        const StakeRewardAdviser = await ethers.getContractFactory(
            'StakeRewardAdviser',
        );

        stakeRewardAdviser = (await StakeRewardAdviser.deploy(
            stakeType,
            stakeAmountToSharesScaledFactor,
        )) as StakeRewardAdviser;

        message = generateMessage(staker, stakeAmount);
    });

    it('should get the FACTOR from contract', async () => {
        const factor = await stakeRewardAdviser.FACTOR();
        expect(factor).to.be.equal(stakeAmountToSharesScaledFactor);
    });

    it('should return the advice of granting shares', async () => {
        const {
            createSharesFor,
            sharesToCreate,
            redeemSharesFrom,
            sharesToRedeem,
            sendRewardTo,
        } = await stakeRewardAdviser.getRewardAdvice(STAKED, message);

        expect(sharesToCreate).to.equal(
            BigNumber.from(stakeAmount)
                .mul(stakeAmountToSharesScaledFactor)
                .div(scale),
        );
        expect(createSharesFor.toLowerCase()).to.equal(staker);

        expect(redeemSharesFrom).to.equal(ethers.constants.AddressZero);
        expect(sharesToRedeem).to.equal(ethers.BigNumber.from(0));
        expect(sendRewardTo).to.equal(ethers.constants.AddressZero);
    });

    it('should return the advice of redeeming shares', async () => {
        const {
            createSharesFor,
            sharesToCreate,
            redeemSharesFrom,
            sharesToRedeem,
            sendRewardTo,
        } = await stakeRewardAdviser.getRewardAdvice(UNSTAKED, message);

        expect(createSharesFor).to.equal(ethers.constants.AddressZero);
        expect(sharesToCreate).to.equal(BigNumber.from(0));
        expect(redeemSharesFrom.toLowerCase()).to.equal(staker);

        expect(sendRewardTo.toLowerCase()).to.equal(staker);
        expect(sharesToRedeem).to.equal(
            BigNumber.from(stakeAmount)
                .mul(stakeAmountToSharesScaledFactor)
                .div(scale),
        );
    });

    it('should revert if the action is invalid', async () => {
        const unsupportedAction = '0x12345678';

        await expect(
            stakeRewardAdviser.getRewardAdvice(unsupportedAction, message),
        ).to.be.revertedWith('PSA: unsupported action');
    });

    it('should revert staker is zero address', async () => {
        const message = generateMessage(
            ethers.constants.AddressZero,
            stakeAmount,
        );

        await expect(
            stakeRewardAdviser.getRewardAdvice(STAKED, message),
        ).to.be.revertedWith('PSA: unexpected zero staker');
    });

    it('should revert if amount is zero', async () => {
        const message = generateMessage(staker, '0x000000000000000000000000');

        await expect(
            stakeRewardAdviser.getRewardAdvice(STAKED, message),
        ).to.be.revertedWith('PSA: unexpected zero amount');
    });
});
