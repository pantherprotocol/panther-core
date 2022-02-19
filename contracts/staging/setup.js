
// rewardPoolFactory = await ethers.getContractFactory('RewardPool', deployer);
// rewardPool = await RewardPool.deploy(vestingPools.address, deployer.address);
rewardPool = await ethers.getContract('RewardPool');

startTime = await getTime();

stakeRewardAdviser = await ethers.getContract('StakeRewardAdviser');
rewardMaster = await ethers.getContract('RewardMaster');

staking = await ethers.getContract('Staking');

// yarn hardhat terms:add
//
// instead of:
//
// txs.addTerms = await staking.addTerms(CLASSIC, {isEnabled: true, isRewarded: true, minAmountScaled: 0, maxAmountScaled: 0, allowedSince: 0, allowedTill: 0, lockedTill: 0, exactLockPeriod: 0, minLockPeriod: 100});

// yarn hardhat adviser:add
//
// instead of:
//
// txs.addRewardAdviserStake = await rewardMaster.addRewardAdviser(staking.address, STAKE, stakeRewardAdviser.address);
// txs.addRewardAdviserUnstake = await rewardMaster.addRewardAdviser(staking.address, UNSTAKE, stakeRewardAdviser.address);

// yarn hardhat rewardpool:init 12 1209600
//
// instead of:
//
// now = new Date().getTime() / 1000;
// poolDuration = 3600 * 24 * 14; // 2 weeks == 1209600s
// poolEndTime = Math.floor(now + Number(poolDuration));
// txs.rewardPoolInit = await rewardPool.initialize(12, rewardMaster.address, poolEndTime);

// For staking:
// 1e6 * 1e18 token amount shall generate 1e18 share
