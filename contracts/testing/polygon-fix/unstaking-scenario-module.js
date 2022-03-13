/*
This module is supposed for manual testing of "unstaking" in the hardhat forked Polygon environment.
For example, to test batch unstaking, run this in hardhat console:

  // Useful shortcuts for quick typing (optional)
  _ = require('lodash'); null;
  e = ethers = hre.ethers; null;
  u = ethers.utils; null;
  let {fe, pe, BN, toBN, td} = require('./lib/units-shortcuts');

  stakesData = require('./testing/polygon-fix/data/staking_3.json').slice(0, 100); null
  getTest = require('./testing/polygon-fix/unstaking-scenario-module.js')
  t = getTest(hre, stakesData); null
  let {contracts, signers, showBalances} = await t.init('2022-05-02T18:00Z'); null

  await showBalances()
  resultsBefore = await t.batchUnstake(stakesData.slice(0, 5)); resultsBefore.length
  await showBalances()
  await t.increaseTime(3600 * 24);
  resultsAfter = await t.batchUnstake(stakesData.slice(5, 10)); resultsAfter.length
  await showBalances()

Or for a full simulation:

  simulationData = require('./testing/polygon-fix/data/actions.json'); simulationData.length
  _ = require('lodash'); null
  let [historical, toSimulate] = _.partition(simulationData, i => i.type === "real"); [historical.length, toSimulate.length]
  getTest = require('./testing/polygon-fix/unstaking-scenario-module.js')
  t = getTest(hre, historical); null
  let {contracts, signers, showBalances} = await t.init(); null
  results = await t.executeSimulation(toSimulate); results.length

Note that the newTime parameter to init() (or current time, if not supplied)
needs to be after the end of historical data for saveHistoricalData() to work,
but before the reward period ends for deployment of StakeRewardController to
work.
*/

const _ = require('lodash');
const {
    classicActionHash,
    hash4bytes,
    CLASSIC,
    STAKE,
    UNSTAKE,
} = require('../../lib/hash');
const {
    impersonate,
    unimpersonate,
    increaseTime,
    mineBlock,
    ensureMinBalance,
} = require('../../lib/hardhat');
const {replaceRewardAdviser, saveHistoricalData} = require('../../lib/staking');
const {getEventFromReceipt} = require('../../lib/events');
const {parseDate} = require('../../lib/units-shortcuts');
const {getBlockTimestamp} = require('../../lib/provider');
const {
    MINTER,
    OWNER,
    REWARDING_START,
    getContracts,
    getSigners,
    mintTo: _mintTo,
    showBalances: _showBalances,
    showStates: _showStates,
    ensureMinTokenBalance,
} = require('../../lib/polygon-fix');

module.exports = (hre, stakesData) => {
    const {ethers} = hre;
    const {constants, utils} = ethers;
    const fe = utils.formatEther;

    console.log(`stakesData.length = ${stakesData.length})`);

    const ACTION_STAKE = classicActionHash(STAKE);
    const ACTION_UNSTAKE = classicActionHash(UNSTAKE);
    const oneMatic = utils.parseEther('1');

    const MIN_BALANCE = '0x1000000000000000';

    const provider = ethers.provider;

    let deployer, owner, minter;
    let pzkToken, staking, rewardMaster, rewardTreasury, stakeRwdCtr;
    let mintTo, showBalances, showStates;

    async function init(newTime) {
        if (newTime) {
            const newTimestamp = parseDate(newTime);
            console.log(`time-warping to ${newTime} (${newTimestamp})`);
            await mineBlock(newTimestamp);
        }

        ({deployer, owner, minter} = await getSigners());
        ({pzkToken, staking, rewardMaster, rewardTreasury, stakeRwdCtr} =
            await getContracts(hre, deployer));

        mintTo = _.partial(_mintTo, pzkToken, minter);
        showBalances = _.partial(_showBalances, pzkToken);
        showStates = _.partial(_showStates, pzkToken, staking, stakeRwdCtr);

        await provider.send('hardhat_setBalance', [
            OWNER,
            '0x1000000000000000',
        ]);
        await provider.send('hardhat_setBalance', [
            MINTER,
            '0x1000000000000000',
        ]);

        console.log('Current block time:', await getBlockTimestamp());
        await saveHistoricalData(stakeRwdCtr.connect(deployer), stakesData);
        console.log(
            'stakeRwdCtr.totalStaked: ',
            utils.formatEther(
                await stakeRwdCtr.connect(deployer).totalStaked(),
            ),
        );
        console.log(
            'staking.totalStaked:     ',
            utils.formatEther(await staking.totalStaked()),
        );
        await showBalances();

        await mintTo(rewardTreasury.address, oneMatic.mul(2e6));

        await replaceRewardAdviser(
            rewardMaster.connect(owner),
            staking.address,
            stakeRwdCtr.address,
        );
        console.log(
            'rewardMaster.rewardAdvisers.ACTION_STAKE: ',
            await rewardMaster
                .connect(deployer)
                .rewardAdvisers(staking.address, ACTION_STAKE),
        );

        console.log(
            'rewardMaster.rewardAdvisers.ACTION_UNSTAKE: ',
            await rewardMaster
                .connect(deployer)
                .rewardAdvisers(staking.address, ACTION_UNSTAKE),
        );

        await rewardTreasury
            .connect(owner)
            .approveSpender(
                stakeRwdCtr.address,
                ethers.utils.parseEther('2000000'),
            );
        await stakeRwdCtr.connect(owner).setActive();
        console.log(
            'stakeRwdCtr.isActive: ',
            await stakeRwdCtr.connect(deployer).isActive(),
        ); // true

        return {
            contracts: await getContracts(hre, deployer),
            signers: {deployer, owner, minter},
            mintTo,
            showBalances,
        };
    }

    async function ensureApproval(signer, minRequired) {
        const allowance = await pzkToken.allowance(
            signer.address,
            staking.address,
        );
        if (allowance.lt(minRequired)) {
            const LOTS = ethers.utils.parseEther('2000000');
            console.log(
                `   Allowance for ${signer.address} ${fe(allowance)} ` +
                    `below min ${fe(minRequired)}; approving ${fe(LOTS)}`,
            );
            const tx = await pzkToken
                .connect(signer)
                .approve(staking.address, LOTS);
            await tx.wait();
        }
    }

    async function stake(account, amount) {
        await ensureMinBalance(account, MIN_BALANCE);
        const signer = await impersonate(account);
        await ensureApproval(signer, amount);
        const tx = await staking
            .connect(signer)
            .stake(amount, hash4bytes(CLASSIC), 0x00);
        await unimpersonate(account);
        // console.log(`  submitted as ${tx.hash}`);
        const receipt = await tx.wait();
        const event = await getEventFromReceipt(
            receipt,
            staking,
            'StakeCreated',
        );
        if (!event) {
            console.error(
                receipt,
                "Didn't get StakeCreated event from stake()",
            );
        }
        const stakeId = event?.args?.stakeID;
        return {tx, receipt, event, stakeId};
    }

    async function unstake(account, stakeId) {
        await ensureMinBalance(account, MIN_BALANCE);
        const signer = await impersonate(account);
        const tx = await staking.connect(signer).unstake(stakeId, 0x00, false);
        await unimpersonate(account);
        const receipt = await tx.wait();
        const event = await getEventFromReceipt(
            receipt,
            stakeRwdCtr,
            'RewardPaid',
        );
        if (event) {
            if (event.args && account !== event.args.staker) {
                throw (
                    `Unstaked from ${account} ` +
                    `but got RewardPaid event to ${event.args.staker}`
                );
            }
        } else {
            console.error(receipt);
            throw "Didn't get RewardPaid event from unstake()";
        }
        const reward = event?.args?.reward;
        return {tx, receipt, event, reward};
    }

    async function batchUnstake(stakes) {
        const results = [];
        let i = 0;
        for (const {address, stakeID} of stakes) {
            console.log(`Unstaking #${i++} for ${address}.${stakeID}`);
            const result = await unstake(address, stakeID);
            results.push(result);
            console.log(`  RewardPaid: ${utils.formatEther(result.reward)}`);
        }
        return await Promise.all(results);
    }

    async function executeSimulation(simulationData) {
        const results = [];
        const totalAbsDelta = constants.Zero;
        const netDelta = constants.Zero;
        let i = 0;
        console.log('Current block time:', await getBlockTimestamp());
        for await (const action of simulationData) {
            console.log(
                `Action #${i++} @${action.timestamp} ${action.date}\n` +
                    `${action.action} ${utils.formatEther(action.amount)} ` +
                    `for ${action.address}` +
                    (action.stakeId ? '.' + action.stakeID : ''),
            );
            await ensureMinTokenBalance(
                pzkToken,
                minter,
                action.address,
                action.amount,
            );
            // console.log('action: ', action);
            if (i % 5 == 0) {
                await showStates();
                console.log(
                    `   Total delta: ${fe(totalAbsDelta)} (absolute) / ` +
                        `${fe(netDelta)} (net)`,
                );
            }
            await mineBlock(action.timestamp);
            const promise =
                action.action === 'unstaking'
                    ? unstake(action.address, action.stakeID)
                    : stake(action.address, action.amount);
            const result = await promise;
            results.push(result);
            if (action.action === 'unstaking' && result.reward) {
                const expectedRewards = utils.parseEther(
                    String(action.rewards),
                );
                const actualRewards = result.reward;
                const delta = actualRewards.sub(expectedRewards);
                totalAbsDelta = totalAbsDelta.add(delta.abs());
                netDelta = netDelta.add(delta);
                console.log(
                    `   RewardPaid: ${fe(result.reward)}  delta: ${fe(delta)}`,
                );
            }
            simulationData.transactionHash = result.tx.hash;
            console.log(
                '-------------------------------------------------------',
            );
        }
        return results;
    }

    return {
        getContracts,
        getSigners,
        init,
        batchUnstake,
        unstake,
        executeSimulation,

        parseDate,
        increaseTime,
        mineBlock,

        stakesData,

        constants: {
            ACTION_STAKE,
            ACTION_UNSTAKE,
            REWARDING_START,
            oneMatic,
            MIN_BALANCE,
        },
    };
};
