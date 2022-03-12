import {BigNumber, Contract, utils} from 'ethers';

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
