import {task} from 'hardhat/config';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {advancedActionHash, STAKE} from '../../lib/hash';

const STAKING_BRIDGE_LOCAL = 'staking:bridge:local';

task(
    STAKING_BRIDGE_LOCAL,
    'The task sends a tx on behalf of fxChild to the advancedStakeActionMsgRelayer contract',
)
    .addParam('sender', 'The AdvancedStakeRewardAdviserAndMsgSender address')
    .addParam('relayer', 'The AdvancedStakeActionMsgRelayer proxy address')
    .addOptionalParam('staker', 'The staker address')
    .addOptionalParam('amount', 'The stake amount')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        // Get AdvancedStakeActionMsgRelayer contract
        const AdvancedStakeActionMsgRelayer =
            await hre.ethers.getContractFactory(
                'AdvancedStakeActionMsgRelayer',
            );
        const advancedStakeActionMsgRelayer =
            AdvancedStakeActionMsgRelayer.attach(taskArgs.relayer);

        // Setup the stake message variables
        const staker =
            taskArgs.staker || (await hre.ethers.getSigners())[0].address;
        const amount = hre.ethers.utils.hexZeroPad(
            hre.ethers.utils
                .parseEther(taskArgs.amount || '10000')
                .toHexString(),
            12,
        );

        const now = Math.ceil(Date.now() / 1000);

        const relayerNonce = await advancedStakeActionMsgRelayer.nonce();
        const nonce = hre.ethers.utils
            .hexZeroPad(relayerNonce._hex, 3)
            .replace('0x', '');

        // Generate the stake message
        const message = generateMessage(
            staker,
            amount,
            nonce,
            hre.ethers.utils.hexValue(now),
            hre.ethers.utils.hexValue(now + 86400 * 7),
        );

        // Impersonate the fxChild and increase its Eth balance
        const fxChildAddress = await advancedStakeActionMsgRelayer.FX_CHILD();

        await hre.ethers.provider.send('hardhat_setBalance', [
            fxChildAddress,
            hre.ethers.utils
                .parseUnits('1', 18)
                .toHexString()
                .replace('0x0', '0x'),
        ]);

        await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [fxChildAddress],
        });
        const fxChild = await hre.ethers.getSigner(fxChildAddress);

        // Send the transaction on behalf of FxChild
        const tx = await advancedStakeActionMsgRelayer
            .connect(fxChild)
            .processMessageFromRoot(0, taskArgs.sender, message);

        console.log('Transaction is sent on behalf of FX Child', tx);
    });

function generateMessage(
    address: string,
    amount: string,
    nonce: string,
    stakedAt: string,
    lockedTill: string,
) {
    // random commitment
    const data =
        '0x3061000000000000000000000000000000000000000000000000000000001063101000000000000000000000000000000000000000000000000000000000010130620000000000000000000000000000000000000000000000000000000020632020000000000000000000000000000000000000000000000000000000000202fffe00000000000000000000000000066000000000000000000000000000feeefffe00000000000000000000000000077000000000000000000000000000feeefffe00000000000000000000000000099000000000000000000000000000feeefffe000000000000000000000000000aa000000000000000000000000000feee';
    const stakeAction = advancedActionHash(STAKE).replace('0x', '');

    const stakeMessage = (
        address.replace('0x', '') + // staker
        amount.replace('0x', '') + // amount
        '0000002e' + // id
        stakedAt.replace('0x', '') + // stakedAt
        lockedTill.replace('0x', '') + // lockedTill
        '01324649' + // claimedAt
        data.replace('0x', '')
    ).toLowerCase();

    return '0x' + nonce + stakeAction + stakeMessage;
}
