import {ethers, network} from 'hardhat';
import {expect} from 'chai';
import {MockStakingMsgProcessor} from '../types/contracts';
import {
    hash4bytes,
    classicActionHash,
    CLASSIC,
    STAKE,
    UNSTAKE,
} from '../lib/hash';

const sampleStaker = '0xc0fec0fec0fec0fec0fec0fec0fec0fec0fec0fe';
const sampleStake = {
    id: 0x2e,
    stakeType: [0x57, 0x58, 0x59, 0x5a],
    stakedAt: 0x1324647,
    lockedTill: 0x1324648,
    claimedAt: 0x1324649,
    amount: '0x0a0b0c0d0e0f000000ffffff',
    delegatee: '0xeeddeeddeeddeeddeeddeeddeeddeeddeeddeedd',
};
const expectedEmptyDataMsg =
    '0x' +
    'c0fec0fec0fec0fec0fec0fec0fec0fec0fec0fe' + // staker
    '0a0b0c0d0e0f000000ffffff' + // amount
    '0000002e' + // id
    '01324647' + // stakedAt
    '01324648' + // lockedTill
    '01324649'; // claimedAt

const sampleData = [0xff, 5, 4, 5, 9, 8, 6, 5, 7, 9];
const expectedNonEmptyDataMsg = expectedEmptyDataMsg + 'ff050405090806050709';

describe('StakingMsgProcessor', () => {
    let mockProcessor: MockStakingMsgProcessor;
    let evmId: any;

    before(async () => {
        evmId = await network.provider.send('evm_snapshot');

        const StakingMsgProcessor = await ethers.getContractFactory(
            'MockStakingMsgProcessor',
        );
        mockProcessor =
            (await StakingMsgProcessor.deploy()) as MockStakingMsgProcessor;
    });

    after(async function () {
        await network.provider.send('evm_revert', [evmId]);
    });

    describe('internal _encodeStakeActionType function', () => {
        it('should return expected encoded action type for given input', async () => {
            expect(
                await mockProcessor.internalEncodeStakeActionType(
                    hash4bytes(CLASSIC),
                ),
            ).to.equal(classicActionHash(STAKE));
        });
    });

    describe('internal _encodeUnstakeActionType function', () => {
        it('should return expected encoded action type for given input', async () => {
            expect(
                await mockProcessor.internalEncodeUnstakeActionType(
                    hash4bytes(CLASSIC),
                ),
            ).to.equal(classicActionHash(UNSTAKE));
        });
    });

    describe('internal _packStakingActionMsg function', () => {
        describe('given input with empty `bytes data`', () => {
            it('should return expected encoded message', async () => {
                const emptyDataMsg =
                    await mockProcessor.internalPackStakingActionMsg(
                        sampleStaker,
                        sampleStake,
                        [],
                    );
                expect(emptyDataMsg.toString()).to.equal(expectedEmptyDataMsg);
            });
        });

        describe('given input with non-empty `bytes data`', () => {
            it('should return expected encoded message', async () => {
                const emptyDataMsg =
                    await mockProcessor.internalPackStakingActionMsg(
                        sampleStaker,
                        sampleStake,
                        sampleData,
                    );
                expect(emptyDataMsg.toString()).to.equal(
                    expectedNonEmptyDataMsg,
                );
            });
        });
    });

    describe('internal _unpackStakingActionMsg function', () => {
        let res: any;

        describe('given encoded message with empty `bytes data`', () => {
            beforeEach(async () => {
                res = await mockProcessor.internalUnpackStakingActionMsg(
                    expectedEmptyDataMsg,
                );
            });

            checkUnpackedParams();

            it('should return empty decoded `data`', async () => {
                expect(res.data).to.equal('0x');
            });
        });

        describe('given encoded message with non-empty `bytes data`', () => {
            beforeEach(async () => {
                res = await mockProcessor.internalUnpackStakingActionMsg(
                    expectedNonEmptyDataMsg,
                );
            });

            checkUnpackedParams();

            it('should return expected decoded `data`', async () => {
                expect(res.data).to.equal(ethers.BigNumber.from(sampleData));
            });
        });

        function checkUnpackedParams() {
            it('should return expected decoded `staker`', async () => {
                expect(res.staker.toLowerCase()).to.equal(sampleStaker);
            });

            it('should return expected decoded `amount`', async () => {
                expect(res.amount).to.equal(
                    ethers.BigNumber.from(sampleStake.amount),
                );
            });

            it('should return expected decoded `id`', async () => {
                expect(res.id.toString()).to.equal(sampleStake.id.toString());
            });

            it('should return expected decoded `stakedAt`', async () => {
                expect(res.stakedAt.toString()).to.equal(
                    sampleStake.stakedAt.toString(),
                );
            });

            it('should return expected decoded `lockedTill`', async () => {
                expect(res.lockedTill.toString()).to.equal(
                    sampleStake.lockedTill.toString(),
                );
            });

            it('should return expected decoded `claimedAt`', async () => {
                expect(res.claimedAt.toString()).to.equal(
                    sampleStake.claimedAt.toString(),
                );
            });
        }
    });
});
