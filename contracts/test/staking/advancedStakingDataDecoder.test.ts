import {expect} from 'chai';
// eslint-disable-next-line
import {BigNumberish} from 'ethers';
import hardhat from 'hardhat';

import {data, params} from './assets/advancesStakingData.data';

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

        it('should decode the 1st Ciphertext', () => {
            expect(
                ethers.BigNumber.from(act.secrets[0][0]).toHexString(),
            ).to.be.equal(params.secret00.toLowerCase());
            expect(
                ethers.BigNumber.from(act.secrets[0][1]).toHexString(),
            ).to.be.equal(params.secret01.toLowerCase());
        });

        it('should decode the 2nd Ciphertext', () => {
            expect(
                ethers.BigNumber.from(act.secrets[1][0]).toHexString(),
            ).to.be.equal(params.secret10.toLowerCase());
            expect(
                ethers.BigNumber.from(act.secrets[1][1]).toHexString(),
            ).to.be.equal(params.secret11.toLowerCase());
        });
    });
});
