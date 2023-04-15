import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import hardhat from 'hardhat';

const {ethers} = hardhat;

import {AdvancedStakeV2ActionMsgTranslator} from '../../types/contracts';

describe('AdvancedStakeV2ActionMsgTranslator', () => {
    const advStakeV2 = '0x1954e321';
    const invalidAction = '0x12345678';
    const message = '0x00';

    let translator: AdvancedStakeV2ActionMsgTranslator;
    let user: SignerWithAddress;
    let rewardMaster: SignerWithAddress;

    before(async () => {
        [user, rewardMaster] = await ethers.getSigners();

        const AdvancedStakeV2ActionMsgTranslator =
            await ethers.getContractFactory(
                'AdvancedStakeV2ActionMsgTranslator',
            );
        translator = (await AdvancedStakeV2ActionMsgTranslator.deploy(
            rewardMaster.address,
        )) as AdvancedStakeV2ActionMsgTranslator;
    });

    it('should throw when executed by unauthorized account', async () => {
        await expect(
            translator.connect(user).getRewardAdvice(advStakeV2, message),
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
