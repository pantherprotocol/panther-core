import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
// import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {BigNumber, Contract, ethers, utils} from 'ethers';
import * as fs from 'fs';

import {impersonate} from './hardhat';

export const REWARDING_START = 1646697599;

export const DEPLOYER = '0xe14d84b1DF1C205E33420ffE00bA44F85e35f791';
export const MINTER = '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa';
export const OWNER = '0x208Fb9169BBec5915722e0AfF8B0eeEdaBf8a6f0';

export const TOKEN = '0x9A06Db14D639796B25A6ceC6A1bf614fd98815EC';
export const REWARD_MASTER = '0x09220DD0c342Ee92C333FAa6879984D63B4dff03';
export const STAKING = '0x4cEc451F63DBE47D9dA2DeBE2B734E4CB4000Eac';
export const REWARD_TREASURY = '0x20AD9300BdE78a24798b1Ee2e14858E5581585Bc';

const pzkTokenAbi = JSON.parse(
    fs
        .readFileSync(
            './deployments/ARCHIVE/production/polygon-artifacts/PZkpToken.json',
        )
        .toString(),
).abi;
export const pzkToken = new ethers.Contract(TOKEN, pzkTokenAbi);

export async function getSigners() {
    return {
        deployer: await impersonate(DEPLOYER),
        owner: await impersonate(OWNER),
        minter: await impersonate(MINTER),
    };
}

export async function getContracts(hre: any, deployer: any) {
    return {
        pzkToken: pzkToken,
        staking: await hre.ethers.getContractAt('Staking', STAKING),
        rewardMaster: await hre.ethers.getContractAt(
            'RewardMaster',
            REWARD_MASTER,
        ),
        rewardTreasury: await hre.ethers.getContractAt(
            'RewardTreasury',
            REWARD_TREASURY,
        ),
        stakeRwdCtr: await deployController(hre, deployer),
    };
}

async function deployController(hre: any, deployer: SignerWithAddress) {
    const StakeRewardController = await hre.ethers.getContractFactory(
        'StakeRewardController',
        hre.ethers.provider,
    );
    return await StakeRewardController.connect(deployer).deploy(
        OWNER,
        TOKEN,
        STAKING,
        REWARD_TREASURY,
        REWARD_MASTER,
        DEPLOYER, // historyProvider
        REWARDING_START,
    );
}

const fe = utils.formatEther;

async function getBalances(
    token: Contract,
    staker: string,
    treasury: string,
    rewardMaster: string,
) {
    return Promise.all(
        [staker, treasury, rewardMaster].map(
            async (addr: string) => await token.balanceOf(addr),
        ),
    );
}

export function getBalanceFetcher(
    token: Contract,
    staker: string,
    treasury: string,
    rewardMaster: string,
) {
    return async () => getBalances(token, staker, treasury, rewardMaster);
}

export function showBalances(balances: BigNumber[]): void {
    console.log(`
staker:       ${fe(balances[0])}
treasury:     ${fe(balances[1])}
rewardMaster: ${fe(balances[2])}
`);
}

export async function mintTo(
    recipient: string,
    minter: SignerWithAddress,
    amount: BigNumber,
): Promise<void> {
    await pzkToken
        .connect(minter)
        .deposit(recipient, ethers.utils.hexZeroPad(amount.toHexString(), 32));
}
