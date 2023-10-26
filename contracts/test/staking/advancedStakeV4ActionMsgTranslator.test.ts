import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import hardhat from 'hardhat';

const {ethers} = hardhat;

import {AdvancedStakeV4ActionMsgTranslator} from '../../types/contracts';

describe.only('AdvancedStakeV4ActionMsgTranslator', () => {
    const advStakeV4 = '0x02024d66';
    const invalidAction = '0x12345678';
    const message = '0x00';

    let translator: AdvancedStakeV4ActionMsgTranslator;
    let user: SignerWithAddress;
    let rewardMaster: SignerWithAddress;

    before(async () => {
        [user, rewardMaster] = await ethers.getSigners();

        const AdvancedStakeV4ActionMsgTranslator =
            await ethers.getContractFactory(
                'AdvancedStakeV4ActionMsgTranslator',
            );
        translator = (await AdvancedStakeV4ActionMsgTranslator.deploy(
            rewardMaster.address,
        )) as AdvancedStakeV4ActionMsgTranslator;
    });

    it('should throw when executed by unauthorized account', async () => {
        await expect(
            translator.connect(user).getRewardAdvice(advStakeV4, message),
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
