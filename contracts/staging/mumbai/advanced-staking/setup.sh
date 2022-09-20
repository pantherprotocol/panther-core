### Involved repositories:
# - panther-core: the current repo
# - zkp-token: https://github.com/pantherprotocol/zkp-token


# In panther-core repo:

### ===== Deploy and verify contracts: =====

yarn deploy --network mumbai
yarn verify --network mumbai

# For an unknown reason, the PantherPoolV0_Implementation won't be verified automatically using the above command, so we need to do it manually. First, find the pool implementation address and its args at `deployments/mumbai/PantherPoolV0_Implementation.json` and then use it in the following command:
yarn hardhat verify <pool_implementation_address> arg_1 arg_2 arg_3 arg_4 --network mumbai


### ===== Add the advancedStakeRewardController contract as advisor to rewardMaster: =====

yarn hardhat adviser:add --network mumbai

### ===== Add advanced staking terms: =====
# you can add the default terms that has been defined in the task OR add your own terms.

# To add the default terms:

yarn hardhat terms:add --network mumbai

# To add your own terms:

# info: Don't forget to change the `allowedSince`, `allowedTill` and `lockedTill`.
echo '{"advanced":{"isEnabled":"true","isRewarded":"true","minAmountScaled":"100","maxAmountScaled":"0","allowedSince":"26 Jun 2022 12:00:00 GMT","allowedTill":"28 Jun 2022 12:00:00 GMT","lockedTill":"29 Jun 2022 12:00:00 GMT","exactLockPeriod":"0","minLockPeriod":"0"}}' | yarn hardhat terms:add --json true --network mumbai

### ===== Add the PRP amounts to AdvancedStakeRewardController contract: =====

# info: --amount is the prp amount. you can change it to any amount you want.
yarn hardhat grant:enable --curator <AdvancedStakeRewardController_address> --amount 1000000 --network mumbai


### ===== Whitelist ZKP: =====

# info: --token is the address of ZKP token. you can change it to any token you want. --scale should not be changed.
yarn hardhat zasset:add --token 0x3F73371cFA58F338C479928AC7B4327478Cb859f --scale 11 --network mumbai


### ===== Whitelist PNFT: =====

# info: --token is the address of PNFT token. you can change it to any token you want. --scale and --token-type should not be changed.
yarn hardhat zasset:add --token 0x45c7650cbE485d3c85B739799A4D2eEF9FB46d60 --scale 0 --token-type 0x10 --network mumbai


### ===== Update the pool exit times: =====

# info: Don't forget to add the POOL_EXIT_TIME and POOL_EXIT_DELAY to the .env
yarn hardhat exittime:update --network mumbai


### ===== Update the reward parameters in the AdvancedStakeRewardController: =====

# info: you can change parameters as well. The unit of --start-time and --end-time can be second, minute. day, week and so on.
yarn hardhat rewards:params:update --start-time '1 second' --end-time '1 week' --start-zkp-apy 50 --end-zkp-apy 30 --prp-per-stake 10000 --network mumbai


### ===== Go to zkpToken repo and execute the following command to increase the ZKP balance of AdvancedStakeRewardController: =====

# info: you can change the --amount, it's the zkp token amount without decimals. i.e: 10000000 = 10000000e18 ZKP
yarn hardhat pzkp:deposit --receiver <AdvancedStakeRewardController_address> --amount 10000000 --network mumbai

### ===== Go to panther-core repo and execute the following command: =====

# info: you can change the --nft-limit, it's the number of NFTs that can be minted by AdvancedStakeRewardController
yarn hardhat rewards:limit:add --nft-limit 50 --network mumbai






