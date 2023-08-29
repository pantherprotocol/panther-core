import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import hardhat from 'hardhat';

const {ethers} = hardhat;

import {AdvancedStakeV3ActionMsgTranslator} from '../../types/contracts';

describe.only('AdvancedStakeV3ActionMsgTranslator', () => {
    const advStakeV3 = '0x2991610f';
    const invalidAction = '0x12345678';
    const message = '0x00';

    let translator: AdvancedStakeV3ActionMsgTranslator;
    let user: SignerWithAddress;
    let rewardMaster: SignerWithAddress;

    before(async () => {
        [user, rewardMaster] = await ethers.getSigners();

        const AdvancedStakeV3ActionMsgTranslator =
            await ethers.getContractFactory(
                'AdvancedStakeV3ActionMsgTranslator',
            );
        translator = (await AdvancedStakeV3ActionMsgTranslator.deploy(
            rewardMaster.address,
        )) as AdvancedStakeV3ActionMsgTranslator;
    });

    it('should throw when executed by unauthorized account', async () => {
        await expect(
            translator.connect(user).getRewardAdvice(advStakeV3, message),
        ).to.be.revertedWith('AMT: unauthorized');
    });

    it('should throw when executed with invalid action type', async () => {
        await expect(
            translator
                .connect(rewardMaster)
                .getRewardAdvice(invalidAction, message),
        ).to.be.revertedWith('AMT: unsupported action');
    });
});
