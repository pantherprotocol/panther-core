/*
This module is supposed for manual testing of "unstaking" in the hardhat forked Polygon environment.
For example, run in hardhat console:

  getTest = require('./testing/polygon-fix/unstaking-scenario-module.js')
  t = getTest(hre)
  contracts = await t.init('2022-05-02T18:00Z')
  txs = await t.batchUnstake(t.stakesData.slice(0, 5))
  await t.increaseTime(3600 * 24);
  txs = await t.batchUnstake(t.stakesData.slice(5, 10))

Note that newTime parameter to init() needs to be after the end of historical
data for saveHistoricalData() to work, but before the reward period ends for
deployment of StakeRewardController to work.
*/

const stakesData = require('./data/staking_3.json');
const PZkpToken = require('./PZkpToken.json');
const {classicActionHash, STAKE, UNSTAKE} = require('../../lib/hash');
const {impersonate, unimpersonate, increaseTime, mineBlock} = require('../../lib/hardhat');
const {parseDate} = require('../../lib/units-shortcuts');

module.exports = hre => {
    const {ethers} = hre;

    console.log(`stakesData.length = ${stakesData.length})`);

    const defaultNewTime = '2022-03-24T00:00:05.000Z';

    const actionStake = classicActionHash(STAKE);
    const actionUnstake = classicActionHash(UNSTAKE);
    const rewardingStart = 1646697599;
    const oneMatic = ethers.BigNumber.from(`${1e18}`);

    const minBalanceStr = '0x1000000000000000';
    const minBalance = ethers.BigNumber.from(minBalanceStr);

    const provider = ethers.provider;

    const _deployer = '0xe14d84b1DF1C205E33420ffE00bA44F85e35f791';
    const _minter = '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa';
    const _token = '0x9A06Db14D639796B25A6ceC6A1bf614fd98815EC';
    const _owner = '0x208Fb9169BBec5915722e0AfF8B0eeEdaBf8a6f0';
    const _rewardMaster = '0x09220DD0c342Ee92C333FAa6879984D63B4dff03';
    const _staking = '0x4cEc451F63DBE47D9dA2DeBE2B734E4CB4000Eac';
    const _rewardTreasury = '0x20AD9300BdE78a24798b1Ee2e14858E5581585Bc';

    let deployer, owner, minter;
    let pzkToken, staking, rewardMaster, rewardTreasury, stakeRwdCtr;

    async function init(newTime = defaultNewTime) {
        const newTimestamp = parseDate(newTime);
        console.log(`time-warping to ${newTime} (${newTimestamp})`);
        await mineBlock(newTimestamp);

        await impersonate(_deployer);
        deployer = await ethers.getSigner(_deployer);
        await impersonate(_owner);
        owner = await ethers.getSigner(_owner);
        await provider.send('hardhat_setBalance', [
            _owner,
            '0x1000000000000000',
        ]);
        minter = await ethers.getSigner(_minter);
        await impersonate(_minter);
        await provider.send('hardhat_setBalance', [
            _minter,
            '0x1000000000000000',
        ]);

        pzkToken = new ethers.Contract(_token, PZkpToken.abi);
        const Staking = await ethers.getContractFactory('Staking', provider);
        staking = await Staking.attach(_staking);
        const RewardMaster = await ethers.getContractFactory(
            'RewardMaster',
            provider,
        );
        rewardMaster = await RewardMaster.attach(_rewardMaster);
        const RewardTreasury = await ethers.getContractFactory(
            'RewardTreasury',
            provider,
        );
        rewardTreasury = await RewardTreasury.attach(_rewardTreasury);

        const StakeRewardController = await ethers.getContractFactory(
            'StakeRewardController',
            provider,
        );
        stakeRwdCtr = await StakeRewardController.connect(deployer).deploy(
            _owner,
            _token,
            _staking,
            _rewardTreasury,
            _rewardMaster,
            _deployer,
            rewardingStart,
        );
        await stakeRwdCtr.connect(deployer).saveHistoricalData(
            stakesData.map(e => e.amount),
            stakesData.map(e => e.timestamp),
            stakesData[stakesData.length - 1].timestamp + 100,
        );
        await stakeRwdCtr.isInitialized(); // true
        console.log(
            'stakeRwdCtr.totalStaked: ',
            (await stakeRwdCtr.connect(deployer).totalStaked()).toString(),
        );
        console.log(
            'staking.totalStaked:     ',
            (await staking.totalStaked()).toString(),
        );

        await pzkToken
            .connect(minter)
            .deposit(
                _rewardTreasury,
                ethers.utils.hexZeroPad(oneMatic.mul(2e6).toHexString(), 32),
            );

        await rewardMaster
            .connect(owner)
            .removeRewardAdviser(_staking, actionStake);
        await rewardMaster
            .connect(owner)
            .removeRewardAdviser(_staking, actionUnstake);
        await rewardMaster
            .connect(owner)
            .addRewardAdviser(_staking, actionStake, stakeRwdCtr.address);
        await rewardMaster
            .connect(owner)
            .addRewardAdviser(_staking, actionUnstake, stakeRwdCtr.address);
        console.log(
            'rewardMaster.rewardAdvisers.actionStake: ',
            await rewardMaster
                .connect(deployer)
                .rewardAdvisers(_staking, actionStake),
        );

        console.log(
            'rewardMaster.rewardAdvisers.actionUnstake: ',
            await rewardMaster
                .connect(deployer)
                .rewardAdvisers(_staking, actionUnstake),
        );

        await rewardTreasury
            .connect(owner)
            .approveSpender(stakeRwdCtr.address, '2000000000000000000000000');
        await stakeRwdCtr.connect(owner).setActive();
        console.log(
            'stakeRwdCtr.isActive: ',
            await stakeRwdCtr.connect(deployer).isActive(),
        ); // true

        return getContracts();
    }

    async function unstake(account, stakeId) {
        const balance = await provider.getBalance(account);
        if (minBalance.gt(balance)) {
            await provider.send('hardhat_setBalance', [
                account,
                minBalanceStr,
            ]);
        }
        await impersonate(account);
        const signer = await ethers.getSigner(account);
        const tx = await staking.connect(signer).unstake(stakeId, 0x00, false);
        await unimpersonate(account);
        return await tx.wait();
    }

    async function batchUnstake(stakes) {
        let txs = [];
        let i = 0;
        for (let {address, stakeID} of stakes) {
            console.log(`Unstaking #${i++} for ${address}.${stakeID}`);
            const tx = await unstake(address, stakeID);
            txs.push(tx);
        }
        return await Promise.all(txs);
    }

    function getContracts() {
        return {
            pzkToken,
            staking,
            rewardMaster,
            rewardTreasury,
            stakeRwdCtr,
        };
    }

    function getSigners() {
        return {
            deployer,
            owner,
            minter,
        };
    }

    function getAddresses() {
        return {
            _deployer,
            _minter,
            _token,
            _owner,
            _rewardMaster,
            _staking,
            _rewardTreasury,
        };
    }

    return {
        getAddresses,
        getContracts,
        getSigners,
        init,
        batchUnstake,
        unstake,

        parseDate,
        increaseTime,
        mineBlock,

        stakesData,

        constants: {
            actionStake,
            actionUnstake,
            rewardingStart,
            oneMatic,
            minBalanceStr,
            minBalance,
        },
    };
};
