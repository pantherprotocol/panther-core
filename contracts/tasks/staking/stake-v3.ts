// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-23 Panther Ventures Limited Gibraltar

import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {task} from 'hardhat/config';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {
    AdvancedStakeRewardController,
    RewardMaster,
    Staking,
} from '../../types/contracts';

const msgTranslatorV3PolygonAddress =
    '0xEcFB63f904C39242684c8d903247B25935d8F85d';
const rewardMasterPolygonAddress = '0x09220DD0c342Ee92C333FAa6879984D63B4dff03';
const stakingPolygonAddress = '0x4cEc451F63DBE47D9dA2DeBE2B734E4CB4000Eac';
const contrllerPolygonAddress = '0x8f15a43961c27C74CB4F55234A78802401614de3';
// const deterministicDeployerAddress =
// '0x4e59b44847b379578588920cA78FbF26c0B4956C';
const zkpPolygonAddress = '0x9A06Db14D639796B25A6ceC6A1bf614fd98815EC';
const ownerAddress = '0x208Fb9169BBec5915722e0AfF8B0eeEdaBf8a6f0';
const whaleAddress = '0x2BFaf7aA04e8370B9c20c67EC1973DaCf86E5784';

const msgTranslatorV3DeployedCodes =
    '0x608060405234801561001057600080fd5b506004361061002b5760003560e01c8063e9cb032414610030575b600080fd5b61004361003e3660046102cc565b6100be565b6040516100b59190600060a08201905073ffffffffffffffffffffffffffffffffffffffff80845116835260208401516bffffffffffffffffffffffff808216602086015282604087015116604086015280606087015116606086015250508060808501511660808401525092915050565b60405180910390f35b6040805160a0810182526000808252602082018190529181018290526060810182905260808101919091523373ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000009220dd0c342ee92c333faa6879984d63b4dff0316146101735760405162461bcd60e51b815260206004820152601160248201527f414d543a20756e617574686f72697a656400000000000000000000000000000060448201526064015b60405180910390fd5b63d66e9ef160e01b6001600160e01b031984160161022457604051630dc3282360e11b815273ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000009220dd0c342ee92c333faa6879984d63b4dff031690631b865046906101ed906319932b9d60e31b90869060040161039d565b600060405180830381600087803b15801561020757600080fd5b505af115801561021b573d6000803e3d6000fd5b50505050610284565b6001600160e01b0319831663c087311160e01b146102845760405162461bcd60e51b815260206004820152601760248201527f414d543a20756e737570706f7274656420616374696f6e000000000000000000604482015260640161016a565b506040805160a08101825260008082526020820181905291810182905260608101829052608081019190915292915050565b634e487b7160e01b600052604160045260246000fd5b600080604083850312156102df57600080fd5b82356001600160e01b0319811681146102f757600080fd5b9150602083013567ffffffffffffffff8082111561031457600080fd5b818501915085601f83011261032857600080fd5b81358181111561033a5761033a6102b6565b604051601f8201601f19908116603f01168101908382118183101715610362576103626102b6565b8160405282815288602084870101111561037b57600080fd5b8260208601602083013760006020848301015280955050505050509250929050565b63ffffffff60e01b8316815260006020604081840152835180604085015260005b818110156103da578581018301518582016060015282016103be565b506000606082860101526060601f19601f83011685010192505050939250505056fea164736f6c6343000810000a';

const ADV_STAKE_V3_TYPE = '0x466b3169';

const ADVANCED_STAKE_V3 = '0x2991610f';
const ADVANCED_UNSTAKE_V3 = '0xc0873111';

const ADVANCED_STAKE_V1 = '0xcc995ce8';
const ADVANCED_UNSTAKE_V1 = '0xb8372e55';

const advStakeV3Terms = {
    isEnabled: true,
    isRewarded: true,
    minAmountScaled: 1000,
    maxAmountScaled: 0,
    allowedSince: 1692705600,
    allowedTill: 1697932800,
    lockedTill: 0,
    exactLockPeriod: 0,
    minLockPeriod: 5184000,
};

const rewardParams = {
    startTime: 1692705600,
    endTime: 1703116800,
    startZkpApy: 15,
    endZkpApy: 15,
};

task('stake:v3', '').setAction(
    async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
        // ******* CONFIGURATIONS *******
        console.log(
            'Executing on forked network at block ',
            await hre.ethers.provider.getBlockNumber(),
        );

        const owner = await impersonate(hre, ownerAddress);
        const whale = await impersonate(hre, whaleAddress);

        await topUpBalance(hre, ownerAddress);
        await topUpBalance(hre, whaleAddress);

        const zkp = await hre.ethers.getContractAt('ERC20', zkpPolygonAddress);

        console.log('Setting Translator Codes');
        await hre.ethers.provider.send('hardhat_setCode', [
            msgTranslatorV3PolygonAddress,
            msgTranslatorV3DeployedCodes,
        ]);

        console.log('Config Stakeing contracts');
        const rewardMaster = (await hre.ethers.getContractAt(
            'RewardMaster',
            rewardMasterPolygonAddress,
        )) as RewardMaster;

        const staking = (await hre.ethers.getContractAt(
            'Staking',
            stakingPolygonAddress,
        )) as Staking;

        const advStakeRewardController = (await hre.ethers.getContractAt(
            'AdvancedStakeRewardController',
            contrllerPolygonAddress,
        )) as AdvancedStakeRewardController;

        await rewardMaster
            .connect(owner)
            .addRewardAdviser(
                stakingPolygonAddress,
                ADVANCED_STAKE_V3,
                msgTranslatorV3PolygonAddress,
            );
        await rewardMaster
            .connect(owner)
            .addRewardAdviser(
                stakingPolygonAddress,
                ADVANCED_UNSTAKE_V3,
                msgTranslatorV3PolygonAddress,
            );

        await rewardMaster
            .connect(owner)
            .addRewardAdviser(
                msgTranslatorV3PolygonAddress,
                ADVANCED_STAKE_V1,
                contrllerPolygonAddress,
            );
        await rewardMaster
            .connect(owner)
            .addRewardAdviser(
                msgTranslatorV3PolygonAddress,
                ADVANCED_UNSTAKE_V1,
                contrllerPolygonAddress,
            );

        await staking
            .connect(owner)
            .addTerms(ADV_STAKE_V3_TYPE, advStakeV3Terms);

        await advStakeRewardController
            .connect(owner)
            .updateRewardParams(rewardParams);

        // ******* CREATE STAKE *******

        await hre.ethers.provider.send('evm_mine', [
            +advStakeV3Terms.allowedSince.toString(),
        ]);

        const stakeAmount = ethers.utils.parseEther('1010');
        await zkp.connect(whale).approve(staking.address, stakeAmount);
        const advStakeTestData =
            '0x3061000000000000000000000000000000000000000000000000000000001063101000000000000000000000000000000000000000000000000000000000010130620000000000000000000000000000000000000000000000000000000020632020000000000000000000000000000000000000000000000000000000000202fffe00000000000000000000000000066000000000000000000000000000feeefffe00000000000000000000000000077000000000000000000000000000feeefffe00000000000000000000000000099000000000000000000000000000feeefffe000000000000000000000000000aa000000000000000000000000000feee';
        const tx = await staking
            .connect(whale)
            .stake(stakeAmount, ADV_STAKE_V3_TYPE, advStakeTestData);
        const res = await tx.wait();

        console.log(res.events[2].args?.stakeType);

        const accountStakes = await staking.accountStakes(whale.address);
        console.log(accountStakes[accountStakes.length - 1]);
    },
);

async function topUpBalance(
    hre: HardhatRuntimeEnvironment,
    address: string,
): Promise<void> {
    await hre.ethers.provider.send('hardhat_setBalance', [
        address,
        // replace() is necessary due to hex quantities
        // with leading zeros are not valid at the JSON-RPC layer
        // https://github.com/NomicFoundation/hardhat/issues/1585
        hre.ethers.utils
            .parseUnits('100', 18)
            .toHexString()
            .replace('0x0', '0x'),
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
