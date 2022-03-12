import {Contract} from 'ethers';

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
