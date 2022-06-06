// Testing Polygon staking bug fix in a local fork:
//
//    cp .env.matic-fork.example .env
//    // Edit .env to add missing keys
//    yarn hardhat node --no-deploy
//    yarn deploy --network localhost --tags StakeRewardController
//    yarn console
//
// then copy and paste the below:

_ = require('lodash'); null;
e = ethers = hre.ethers; null;
u = ethers.utils; null;
let {fe, pe, BN, toBN, td} = require('./lib/units-shortcuts');
hnp = hre.network.provider;
let {increaseTime, impersonate} = require('./lib/hardhat');
let {showStake: _showStake, replaceRewardAdviser} = require('./lib/staking');
imp = impersonate;
let {getBalanceFetcher, showBalances} = require('./lib/polygon-fix');

let {deployer} = await e.getNamedSigners(); deployer.address;

tokenAddress = process.env.ZKP_TOKEN_ADDRESS;
stakingAddress = process.env.STAKING_CONTRACT;
treasuryAddress = process.env.REWARD_TREASURY;
rewardMasterAddress = process.env.REWARD_MASTER;
controllerAddress = process.env.STAKE_REWARD_CONTROLLER;

abi = JSON.parse(fs.readFileSync('../../zkp-token/artifacts/contracts/PZkpToken.sol/PZkpToken.json')).abi; abi.map(i => i.name).slice(0, 5);
token = await ethers.getContractAt(abi, tokenAddress); null;
getBal = async addr => u.formatEther(await token.balanceOf(addr));

staking = await ethers.getContractAt('Staking', stakingAddress); null;
showStake = _.partial(_showStake, staking);

fe(await staking.totalStaked());

rewardMaster = await ethers.getContractAt('RewardMaster', rewardMasterAddress); null;
treasury = await ethers.getContractAt('RewardTreasury', treasuryAddress); null;

getBals = getBalanceFetcher(token, stakingAddress, treasuryAddress, rewardMasterAddress);
await getBals();

minterAddress = await token.minter(); minterAddress;

// Transfer MATIC to minter
// Doesn't work:
// Uncaught ProviderError: Error: Transaction reverted without a reason string
// tx = await deployer.sendTransaction({value: u.parseEther('1000000'), to: minterAddress});

// Mint ZKP to treasury
// Doesn't work without some MATIC:
// ProviderError: sender doesn't have enough funds to send tx. The max upfront cost is: 648312 and the sender's account only has: 0
// minter = await imp(minterAddress); minter.address;
// tx = await token.connect(minter).deposit(treasuryAddress, u.hexZeroPad(u.parseEther('1000000'), 32));

/////////////////////////////////////////////////////////////////////////
// Transfer ZKP from mini-whale to treasury
// Found via https://polygonscan.com/token/0x9a06db14d639796b25a6cec6a1bf614fd98815ec#balances
dolphin = await imp('0x71ac71696a6f0d93e90497ff1d607d1d828413c8'); dolphin.address;
await getBal(dolphin.address);
await getBal(treasuryAddress);
balance = await token.balanceOf(dolphin.address);
tx = await token.connect(dolphin).transfer(treasuryAddress, balance); r = await tx.wait();
await getBal(dolphin.address);
await getBal(treasuryAddress);

/////////////////////////////////////////////////////////////////////////
// Switch adviser to StakeRewardController
controller = await ethers.getContractAt('StakeRewardController', controllerAddress); null;
owner = await imp(await rewardMaster.OWNER()); owner.address;

tx = await deployer.sendTransaction({value: u.parseEther('1000'), to: owner.address}); r = await tx.wait();

hash = require('./lib/hash');

await replaceRewardAdviser(rewardMaster.connect(owner), staking.address, controller.address);

staker = await imp('0x966d4b4965f3ad106ee1ce3e92f17c7f8505df78'); staker.address;
await getBal(staker.address);
await showStake(staker.address, 0);

// tx = await staking.connect(staker).unstake(0, '0x00', false);
// Should fail with 'Stake locked'

await increaseTime(3600 * 24 * 7);
// tx = await staking.connect(staker).unstake(0, '0x00', false);
// Should fail with 'Staking: REWARD_MASTER reverts'

/////////////////////////////////////////////////////////////////////////
// Approve StakeRewardController to spend from treasury
owner = await imp(await treasury.OWNER()); owner.address;
balance = await token.balanceOf(treasuryAddress);
tx = await treasury.connect(owner).approveSpender(controller.address, balance); r = await tx.wait();
// tx = await staking.connect(staker).unstake(0, '0x00', false);
// Should still fail with 'Staking: REWARD_MASTER reverts'

/////////////////////////////////////////////////////////////////////////
// Activate StakeRewardController
// tx = await controller.setActive();
// Should fail with 'SRC: yet uninitialized'

historyAmounts = JSON.parse(fs.readFileSync('./testing/polygon-fix/amounts.json')); historyAmounts.length;
historyTimestamps = JSON.parse(fs.readFileSync('./testing/polygon-fix/timestamps.json')); historyTimestamps.length;
historyAmounts.length === historyTimestamps.length;

tx = await controller.saveHistoricalData(historyAmounts.slice(0, -1), historyTimestamps.slice(0, -1), 0); r = await tx.wait();
tx = await controller.saveHistoricalData(historyAmounts.slice(-1), historyTimestamps.slice(-1), historyTimestamps.slice(-1)[0]); r = await tx.wait();

tx = await controller.setActive(); r = await tx.wait();

balancesBefore = await getBals(); balancesBefore.map(fe);

await showStake(staker.address, 0);
tx = await staking.connect(staker).unstake(0, '0x00', false); r = await tx.wait();

balancesAfter = await getBals(); balancesAfter.map(fe);

deltas = _.zipWith(balancesBefore, balancesAfter, (b, a) => a.sub(b)); showBalances(deltas);
