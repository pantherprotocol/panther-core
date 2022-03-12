import {ethers} from 'hardhat';
import {assert, expect} from 'chai';
import {BigNumber, constants} from 'ethers';
import {MockVotingPowerSource, VotingPowerInformer} from '../types/contracts';
import {revertSnapshot, takeSnapshot} from '../lib/hardhat';

const toBN = BigNumber.from;
const E18 = toBN(10).pow(18);
const toBN18 = (n: number) => BigNumber.from(n).mul(E18);

describe('VotingPowerInformer', () => {
    let informer: VotingPowerInformer;
    let mockStaking: MockVotingPowerSource;
    let snapshot: number;

    before(async () => {
        const MockVotingPowerSource = await ethers.getContractFactory(
            'MockVotingPowerSource',
        );
        mockStaking =
            (await MockVotingPowerSource.deploy()) as MockVotingPowerSource;

        const VotingPowerInformer = await ethers.getContractFactory(
            'VotingPowerInformer',
        );
        informer = (await VotingPowerInformer.deploy(
            mockStaking.address,
        )) as VotingPowerInformer;

        const powers = Object.values(getSamplePowers());
        await Promise.all(
            powers.map(p =>
                mockStaking._setMockPower(p.address, {
                    own: p.own,
                    delegated: p.delegated,
                }),
            ),
        );
        const {address, own, delegated} = getTotalOfPowers(powers);
        await mockStaking._setMockPower(address, {own, delegated});
    });

    beforeEach(async () => {
        snapshot = await takeSnapshot();
    });

    afterEach(async () => {
        await revertSnapshot(snapshot);
    });

    describe('function getVotes', () => {
        describe('if a voter has neither own nor delegated power', () => {
            it('should return zero', async () => {
                const {
                    erin: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() === '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() === '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.getVotes(address)).to.eq(toBN(0));
            });
        });

        describe('if a voter has own power but no delegated one', () => {
            it('should return own power scaled and rounded', async () => {
                const {
                    alice: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() !== '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() === '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.getVotes(address)).to.eq(own.div(E18));
            });
        });

        describe('if a voter has no own power but has delegated one', () => {
            it('should return delegated power scaled and rounded', async () => {
                const {
                    carol: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() === '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() !== '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.getVotes(address)).to.eq(
                    delegated.div(E18),
                );
            });
        });

        describe('if a voter has both own and delegated power', () => {
            it('should return sum of own and delegated powers scaled and rounded', async () => {
                const {
                    dan: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() !== '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() !== '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.getVotes(address)).to.eq(
                    own.add(delegated).div(E18),
                );
            });
        });

        it('should revert called with zero address of a voter', async () => {
            await expect(informer.getVotes(constants.AddressZero)).revertedWith(
                'VotingPowerInformer: unexpected zero address',
            );
        });
    });

    describe('function getTotalVotes', () => {
        it('should return sum of own and delegated votes (scaled) of all voters', async () => {
            const {own, delegated} = getTotalOfPowers(getSamplePowers());
            expect(await informer.getTotalVotes()).to.eq(
                own.add(delegated).div(E18),
            );
        });
    });

    describe('function balanceOf', () => {
        describe('if a voter has neither own nor delegated power', () => {
            it('should return zero', async () => {
                const {
                    erin: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() === '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() === '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.balanceOf(address)).to.eq(toBN(0));
            });
        });

        describe('if a voter has own power but no delegated one', () => {
            it('should return own power unscaled', async () => {
                const {
                    alice: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() !== '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() === '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.balanceOf(address)).to.eq(own);
            });
        });

        describe('if a voter has no own power but has delegated one', () => {
            it('should return delegated power unscaled', async () => {
                const {
                    carol: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() === '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() !== '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.balanceOf(address)).to.eq(delegated);
            });
        });

        describe('if a voter has both own and delegated power', () => {
            it('should return sum of own and delegated powers unscaled', async () => {
                const {
                    dan: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() !== '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() !== '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.balanceOf(address)).to.eq(
                    own.add(delegated),
                );
            });
        });

        it('should revert called with zero address of a voter', async () => {
            await expect(
                informer.balanceOf(constants.AddressZero),
            ).revertedWith('VotingPowerInformer: unexpected zero address');
        });
    });

    describe('function getQuadraticVotes', () => {
        describe('if a voter has neither own nor delegated power', () => {
            it('should return zero', async () => {
                const {
                    erin: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() === '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() === '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.getQuadraticVotes(address)).to.eq(
                    toBN(0),
                );
            });
        });

        describe('if a voter has own power but no delegated one', () => {
            it('should return square root from own power scaled and rounded', async () => {
                const {
                    alice: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() !== '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() === '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.getQuadraticVotes(address)).to.eq(
                    sqrtRounded(own.div(E18).toNumber()),
                );
            });
        });

        describe('if a voter has no own power but has delegated one', () => {
            it('should return square root from delegated power scaled and rounded', async () => {
                const {
                    carol: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() === '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() !== '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.getQuadraticVotes(address)).to.eq(
                    sqrtRounded(delegated.div(E18).toNumber()),
                );
            });
        });

        describe('if a voter has both own and delegated power', () => {
            it('should return square root from sum of own and delegated powers scaled and rounded', async () => {
                const {
                    dan: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() !== '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() !== '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.getQuadraticVotes(address)).to.eq(
                    getQuadraticVotes(own, delegated),
                );
            });
        });

        it('should revert called with zero address of a voter', async () => {
            await expect(
                informer.getQuadraticVotes(constants.AddressZero),
            ).revertedWith('VotingPowerInformer: unexpected zero address');
        });
    });

    describe('function getQuadraticAdjustedVotes', () => {
        describe('if a voter has neither own nor delegated power', () => {
            it('should return zero', async () => {
                const {
                    erin: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() === '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() === '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.getQuadraticAdjustedVotes(address)).to.eq(
                    toBN(0),
                );
            });
        });

        describe('if a voter has own power but no delegated one', () => {
            it('should return square root from own power scaled and rounded', async () => {
                const {
                    alice: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() !== '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() === '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.getQuadraticAdjustedVotes(address)).to.eq(
                    sqrtRounded(own.div(E18).toNumber()),
                );
            });
        });

        describe('if a voter has no own power but has delegated one', () => {
            it('should return square root from delegated power scaled and rounded', async () => {
                const {
                    carol: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() === '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() !== '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.getQuadraticAdjustedVotes(address)).to.eq(
                    sqrtRounded(delegated.div(E18).toNumber()),
                );
            });
        });

        describe('if a voter has both own and delegated power', () => {
            it('should return sum of square root from own and root from delegated powers - both scaled and rounded', async () => {
                const {
                    dan: {address, own, delegated},
                } = getSamplePowers();
                assert(own.toString() !== '0', 'Unexpected sample data 1');
                assert(
                    delegated.toString() !== '0',
                    'Unexpected sample data 2',
                );

                expect(await informer.getQuadraticAdjustedVotes(address)).to.eq(
                    getQuadraticAdjustedVotes(own, delegated),
                );
            });
        });

        it('should revert called with zero address of a voter', async () => {
            await expect(
                informer.getQuadraticAdjustedVotes(constants.AddressZero),
            ).revertedWith('VotingPowerInformer: unexpected zero address');
        });
    });

    describe('function getTotalQuadraticAdjustedVotes', () => {
        describe('if a voter delegate his voting power', () => {
            it('should return the same (total) power as it has been before delegation', async () => {
                const before = (
                    await informer.getTotalQuadraticAdjustedVotes()
                ).toNumber();

                const {bob} = getSamplePowers();
                const {dan} = getSamplePowers();
                assert(bob.own.toString() !== '0', 'Unexpected sample data 1');
                assert(
                    bob.delegated.toString() === '0',
                    'Unexpected sample data 2',
                );

                dan.delegated = dan.delegated.add(bob.own);
                bob.own = toBN(0);
                await mockStaking._setMockPower(bob.address, {
                    own: bob.own,
                    delegated: bob.delegated,
                });
                await mockStaking._setMockPower(dan.address, {
                    own: dan.own,
                    delegated: dan.delegated,
                });

                const after = (
                    await informer.getTotalQuadraticAdjustedVotes()
                ).toNumber();

                expect(Math.abs(before - after) <= 1).to.eq(true);
            });
        });
    });

    // Data and helpers functions follow

    function getSamplePowers() {
        return {
            alice: {
                address: '0xB992Fb8bf2760bd73F674A70586A1825BE229fdD',
                own: toBN18(90000),
                delegated: toBN(0),
            },
            bob: {
                address: '0x771cAF447163Cba1eEAcD370F5707B3aB0ec48c5',
                own: toBN18(160000),
                delegated: toBN(0),
            },
            carol: {
                address: '0x80F8ba045caa5a097d944E64B971C70e09b9Cf65',
                own: toBN(0),
                delegated: toBN18(250000),
            },
            dan: {
                address: '0x2B64ea5ea17cE5Ac9abf901C6A64E45473b85cF2',
                own: toBN18(9000000),
                delegated: toBN18(16000000),
            },
            erin: {
                address: '0x783d007BDA6385d95cdd92f4042481A9a0492364',
                own: toBN(0),
                delegated: toBN(0),
            },
        };
    }

    function getTotalOfPowers(p: any) {
        const total = {
            address: constants.AddressZero,
            own: toBN(0),
            delegated: toBN(0),
        };
        (Object.values(p) as {own: BigNumber; delegated: BigNumber}[]).forEach(
            ({own, delegated}) => {
                total.own = total.own.add(own);
                total.delegated = total.delegated.add(delegated);
            },
        );
        return total;
    }

    function getQuadraticVotes(own: BigNumber, delegated: BigNumber) {
        return sqrtRounded(own.add(delegated).div(E18).toNumber());
    }

    function getQuadraticAdjustedVotes(own: BigNumber, delegated: BigNumber) {
        const ownVotes = own.div(E18).toNumber();
        const delegatedVotes = delegated.div(E18).toNumber();
        return sqrtRounded(ownVotes) + sqrtRounded(delegatedVotes);
    }

    function sqrtRounded(n: number): number {
        return Number.parseInt(Math.sqrt(n).toString());
    }
});
