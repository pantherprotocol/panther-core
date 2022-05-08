import {expect} from 'chai';
import hardhat from 'hardhat';
import {data, params} from './assets/advancesStakingData.data';
import {BigNumberish} from 'ethers';

const {ethers} = hardhat;

describe('AdvancedStakingDataDecoder', () => {
    let act: {
        pubSpendingKeys: Array<{x: BigNumberish; y: BigNumberish}>;
        secrets: Array<Array<BigNumberish>>;
    };

    describe('for the input given', () => {
        before(async () => {
            const AdvancedStakingDataDecoder = await ethers.getContractFactory(
                'MockAdvancedStakingDataDecoder',
            );
            const decoder = await AdvancedStakingDataDecoder.deploy();

            act = await decoder.internalUnpackStakingData(data);
        });

        it('should decode the 1st pubSpendingKey', () => {
            expect(
                ethers.BigNumber.from(act.pubSpendingKeys[0].x).toHexString(),
            ).to.be.equal(params.pubSpendingKey0X.toLowerCase());
            expect(
                ethers.BigNumber.from(act.pubSpendingKeys[0].y).toHexString(),
            ).to.be.equal(params.pubSpendingKey0Y.toLowerCase());
        });

        it('should decode the 2nd pubSpendingKey', () => {
            expect(
                ethers.BigNumber.from(act.pubSpendingKeys[1].x).toHexString(),
            ).to.be.equal(params.pubSpendingKey1X.toLowerCase());
            expect(
                ethers.BigNumber.from(act.pubSpendingKeys[1].y).toHexString(),
            ).to.be.equal(params.pubSpendingKey1Y.toLowerCase());
        });

        it('should decode the 3rd pubSpendingKey', () => {
            expect(
                ethers.BigNumber.from(act.pubSpendingKeys[2].x).toHexString(),
            ).to.be.equal(params.pubSpendingKey2X.toLowerCase());
            expect(
                ethers.BigNumber.from(act.pubSpendingKeys[2].y).toHexString(),
            ).to.be.equal(params.pubSpendingKey2Y.toLowerCase());
        });

        it('should decode the 1st Ciphertext', () => {
            expect(
                ethers.BigNumber.from(act.secrets[0][0]).toHexString(),
            ).to.be.equal(params.secret00.toLowerCase());
            expect(
                ethers.BigNumber.from(act.secrets[0][1]).toHexString(),
            ).to.be.equal(params.secret01.toLowerCase());
            expect(
                ethers.BigNumber.from(act.secrets[0][2]).toHexString(),
            ).to.be.equal(params.secret02.toLowerCase());
        });

        it('should decode the 2nd Ciphertext', () => {
            expect(
                ethers.BigNumber.from(act.secrets[1][0]).toHexString(),
            ).to.be.equal(params.secret10.toLowerCase());
            expect(
                ethers.BigNumber.from(act.secrets[1][1]).toHexString(),
            ).to.be.equal(params.secret11.toLowerCase());
            expect(
                ethers.BigNumber.from(act.secrets[1][2]).toHexString(),
            ).to.be.equal(params.secret12.toLowerCase());
        });

        it('should decode the 3rd Ciphertext', () => {
            expect(
                ethers.BigNumber.from(act.secrets[2][0]).toHexString(),
            ).to.be.equal(params.secret20.toLowerCase());
            expect(
                ethers.BigNumber.from(act.secrets[2][1]).toHexString(),
            ).to.be.equal(params.secret21.toLowerCase());
            expect(
                ethers.BigNumber.from(act.secrets[2][2]).toHexString(),
            ).to.be.equal(params.secret22.toLowerCase());
        });
    });
});
