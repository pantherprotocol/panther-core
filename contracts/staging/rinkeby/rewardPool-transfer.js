// Transfer ownership of pool #12 to newly deployed RewardPool (same owner)

txs = {};
receipts = {};
w = new ethers.Wallet(process.env.PRIVATE_KEY);

// Run this with old artifacts
rewardPool = await ethers.getContract('RewardPool');

newRewardPool = '0xc6C8C1757a118e2f16E141AB1E1C8bF53198b55C';
txs.rewardPoolTransfer = await rewardPool.transferPoolWalletRole(newRewardPool);
receipts.rewardPoolTransfer = await txs.rewardPoolTransfer.wait();

// Now see zkp-token/docs/staging/staging2-transfer.js
