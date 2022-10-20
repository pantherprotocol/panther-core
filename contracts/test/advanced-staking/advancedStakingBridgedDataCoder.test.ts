import {expect} from 'chai';
import hardhat from 'hardhat';

import {bridgedData} from './assets/advancesStakingData.data';

const {ethers} = hardhat;

describe('AdvancedStakingBridgedDataCoder', () => {
    const getBridgedData = () => bridgedData;

    describe('internal _encodeBridgedData', () => {
        describe('for the predefined input given', () => {
            const {action, content, nonce, message} = getBridgedData();
            let act: string;

            before(async () => {
                const AdvancedStakingBridgedDataCoder =
                    await ethers.getContractFactory(
                        'MockAdvancedStakingBridgedDataCoder',
                    );
                const coder = await AdvancedStakingBridgedDataCoder.deploy();

                act = await coder.internalEncodeBridgedData(
                    nonce,
                    action,
                    message,
                );
            });

            it('should encode `context` as expected', () => {
                expect(act.toLowerCase()).to.be.equal(content.toLowerCase());
            });
        });
    });

    describe('internal _decodeBridgedData', () => {
        describe('for the predefined input given', () => {
            const {action, content, nonce, message} = getBridgedData();
            let act: any;

            before(async () => {
                const AdvancedStakingBridgedDataCoder =
                    await ethers.getContractFactory(
                        'MockAdvancedStakingBridgedDataCoder',
                    );
                const coder = await AdvancedStakingBridgedDataCoder.deploy();

                act = await coder.internalDecodeBridgedData(content);
            });

            it('should decode `nonce` as expected', () => {
                expect(act._nonce).to.be.equal(parseInt(nonce));
            });

            it('should decode `action` as expected', () => {
                expect(act.action).to.be.equal(action);
            });

            it('should decode `message` as expected', () => {
                expect(act.message).to.be.equal(message);
            });
        });
    });
});
