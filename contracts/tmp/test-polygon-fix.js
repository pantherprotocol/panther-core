// yarn hardhat node --no-deploy

e = ethers = hre.ethers; null;
u = ethers.utils; null;
fe = u.formatEther;
pe = u.parseEther;
BN = ethers.BigNumber; null;
toBN = BN.from;
hnp = hre.network.provider; null;
td = toDate = timestamp => new Date(timestamp * 1000);
th = require('./test/helpers/hardhatHelpers');

let {deployer} = await e.getNamedSigners(); deployer.address;

tokenAddress = process.env.TOKEN_ADDRESS;
stakingAddress = process.env.STAKING_CONTRACT;
treasuryAddress = process.env.REWARD_TREASURY;
rewardMasterAddress = process.env.REWARD_MASTER;
controllerAddress = process.env.STAKE_REWARD_CONTROLLER;

abi = JSON.parse(fs.readFileSync('../../zkp-token/artifacts/contracts/PZkpToken.sol/PZkpToken.json')).abi; abi.map(i => i.name);
token = await ethers.getContractAt(abi, tokenAddress); null;
getBal = async addr => u.formatEther(await token.balanceOf(addr));

staking = await ethers.getContractAt('Staking', stakingAddress); null;
fe(await staking.totalStaked());
showStake = async function (addr, stakeId) {stake = await staking.stakes(addr, stakeId); return [fe(stake.amount), td(stake.stakedAt), td(stake.claimedAt)];};

rewardMaster = await ethers.getContractAt('RewardMaster', rewardMasterAddress); null;
treasury = await ethers.getContractAt('RewardTreasury', treasuryAddress); null;

await getBal(treasuryAddress);
await getBal(rewardMasterAddress);

controller = await ethers.getContractAt('StakeRewardController', controllerAddress); null;

imp = async function (addr) {
    await hnp.request({method: 'hardhat_impersonateAccount', params: [addr]});
    return await ethers.getSigner(addr);
};

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
owner = await imp(await rewardMaster.OWNER()); owner.address;

tx = await deployer.sendTransaction({value: u.parseEther('1000'), to: owner.address}); r = await tx.wait();

hash = require('./lib/hash');

tx = await rewardMaster.connect(owner).removeRewardAdviser(staking.address, hash.classicActionHash(hash.STAKE)); r = await tx.wait();
tx = await rewardMaster.connect(owner).removeRewardAdviser(staking.address, hash.classicActionHash(hash.UNSTAKE)); r = await tx.wait();
tx = await rewardMaster.connect(owner).addRewardAdviser(staking.address, hash.classicActionHash(hash.STAKE), controller.address); r = await tx.wait();
tx = await rewardMaster.connect(owner).addRewardAdviser(staking.address, hash.classicActionHash(hash.UNSTAKE), controller.address); r = await tx.wait();

staker = await imp('0x966d4b4965f3ad106ee1ce3e92f17c7f8505df78'); staker.address;
await getBal(staker.address);
await showStake(staker.address, 0);

tx = await staking.connect(staker).unstake(0, '0x00', false);
// Should fail with 'Stake locked'

await th.increaseTime(3600 * 24 * 7);
tx = await staking.connect(staker).unstake(0, '0x00', false); r = await tx.wait();
// Should fail with 'Staking: REWARD_MASTER reverts'

/////////////////////////////////////////////////////////////////////////
// Approve StakeRewardController to spend from treasury
owner = await imp(await treasury.OWNER()); owner.address;
balance = await token.balanceOf(treasuryAddress);
tx = await treasury.connect(owner).approveSpender(controller.address, balance); r = await tx.wait();
// Should still fail with 'Staking: REWARD_MASTER reverts'

/////////////////////////////////////////////////////////////////////////
// Activate StakeRewardController
tx = await controller.setActive(); r = await tx.wait();
// Should fail with 'SRC: yet uninitialized'

historyAmounts = JSON.parse(fs.readFileSync('./tmp/amounts.json')); historyAmounts.length;
historyTimestamps = JSON.parse(fs.readFileSync('./tmp/timestamps.json')); historyTimestamps.length;
historyAmounts.length === historyTimestamps.length;

tx = await controller.saveHistoricalData(historyAmounts.slice(0, -1), historyTimestamps.slice(0, -1), 0); r = await tx.wait();
tx = await controller.saveHistoricalData(historyAmounts.slice(-1), historyTimestamps.slice(-1), historyTimestamps.slice(-1)[0]); r = await tx.wait();

tx = await controller.setActive(); r = await tx.wait();

await getBal(staker.address);
await getBal(treasury.address);

await showStake(staker.address, 0);
tx = await staking.connect(staker).unstake(0, '0x00', false);
