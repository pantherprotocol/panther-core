import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task} from 'hardhat/config';
import {utils} from 'ethers';
import {hash4bytes} from '../lib/hash';

const TERMS_ADD_ADVANCED_LOCAL = 'terms:add:advanced:local';

task(
    TERMS_ADD_ADVANCED_LOCAL,
    'Adds terms to staking contract for advanced staking in local hardhat',
)
    .addPositionalParam('contractAddress', 'Staking contract address')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const staking = await hre.ethers.getContractAt(
            'Staking',
            taskArgs.contractAddress,
        );

        const terms = {
            isEnabled: true,
            isRewarded: false,
            minAmountScaled: utils.hexZeroPad('0x00', 32),
            maxAmountScaled: utils.hexZeroPad('0x00', 32),
            allowedSince: utils.hexZeroPad('0x00', 32),
            allowedTill: utils.hexZeroPad('0x00', 32),
            lockedTill: utils.hexZeroPad('0x00', 32),
            exactLockPeriod: utils.hexZeroPad('0x00', 32),
            minLockPeriod: utils.hexZeroPad('0x1E', 32),
        };

        console.log('Impersonating contract owner');
        const ownerAddress = await staking.OWNER();
        const owner = await impersonate(hre, ownerAddress);
        console.log("Topping up owner's balance");
        await topUpBalance(hre, ownerAddress);

        console.log('Submitting tx to add terms..');
        const stakeType = hash4bytes('advanced');
        const tx = await staking.connect(owner).addTerms(stakeType, terms);
        console.log('Waiting confirmations...');
        const receipt = await tx.wait();
        console.log(
            `Transaction receipt has ${receipt.confirmations} confirmation`,
        );
        console.log('Done!');
    });

// cannot use already written methods in 'contracts/lib/hardhat.ts',
// because file import hardhat (hh) and hh tasks cannot use files which
// has hh import:
// https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/268
async function topUpBalance(
    hre: HardhatRuntimeEnvironment,
    address: string,
): Promise<void> {
    await hre.ethers.provider.send('hardhat_setBalance', [
        address,
        // replace() is necessary due to hex quantities
        // with leading zeros are not valid at the JSON-RPC layer
        // https://github.com/NomicFoundation/hardhat/issues/1585
        utils.parseUnits('100', 18).toHexString().replace('0x0', '0x'),
    ]);
}

async function impersonate(
    hre: HardhatRuntimeEnvironment,
    address: string,
): Promise<SignerWithAddress> {
    await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address],
    });
    console.log('Impersonating address', address);
    return await hre.ethers.getSigner(await address);
}
