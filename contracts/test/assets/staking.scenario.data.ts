import {BigNumber, BigNumberish} from 'ethers';

export type PoolParams = {
    isPreMinted: boolean;
    isAdjustable: boolean;
    start: number;
    vestingDays: number;
    sAllocation: BigNumberish;
    sUnlocked: BigNumberish;
    vested: BigNumberish;
};

export type StakeRecord = {
    user: number;
    amount: BigNumber;
    stakeID: number;
};
export type StakesList = StakeRecord[];

export type PerUserAmounts = BigNumber[];

export type Totals = {
    tokenStaked: PerUserAmounts;
    tokenUnstaked: PerUserAmounts;
    rewardTokenVested: BigNumber;
    rewardTokenEntitled: PerUserAmounts;
    rewardTokenPaid: PerUserAmounts;
};

export type DataPoint = {
    timestamp: number;
    rewardTokenVested: BigNumberish;

    // Array element - index in 'stakes: StakesList'
    stakesStaked: null | number[];
    stakesUnstaked: null | number[];

    // Array element for every user
    stakedBalances: PerUserAmounts;
    sharesBalances: PerUserAmounts;
    rewardTokenEntitled: PerUserAmounts;
    rewardTokenPaid: PerUserAmounts;
    rewardTokenBalances: PerUserAmounts;
    offsets: PerUserAmounts;

    tokensPerShareScaled: BigNumberish;
};

export type Scenario = {
    allocationScale: BigNumber;
    tokensPerShareScale: BigNumber;
    stakeTokenToShare: BigNumber;
    vestingPool: PoolParams;
    totals: Totals;
    stakes: StakesList;
    points: DataPoint[];
};

export const getScenario = (startTime: number): Scenario => {
    const toBN = BigNumber.from;
    const toBnArr = (a: BigNumberish[]) => a.map((e: BigNumberish) => toBN(e));

    const e18 = '000000000000000000';
    const e12 = '000000000000';
    const e9 = '000000000';

    return {
        allocationScale: toBN(1e12), // applied to `sAllocation`
        tokensPerShareScale: toBN(1e9), // applied to `tokensPerShareScaled`,
        stakeTokenToShare: toBN(1e6), // staking token amount to share ratio
        vestingPool: {
            isPreMinted: false,
            isAdjustable: false,
            start: startTime + 100,
            vestingDays: 1,
            sAllocation: toBN('50' + e12), // 50e6 tokens * 1e18 / 1e12
            sUnlocked: 0n,
            vested: 0n,
        },
        stakes: [
            {user: 0, amount: toBN('5000000' + e18), stakeID: 0}, // stake index: #0
            {user: 0, amount: toBN('5000000' + e18), stakeID: 1}, // #1
            {user: 1, amount: toBN('5000000' + e18), stakeID: 0}, // #2
            {user: 1, amount: toBN('10000000' + e18), stakeID: 1}, // #3
            {user: 3, amount: toBN('60000000' + e18), stakeID: 0}, // #4
            {user: 2, amount: toBN('80000000' + e18), stakeID: 0}, // #5
            {user: 0, amount: toBN('30000000' + e18), stakeID: 2}, // #6
            {user: 3, amount: toBN('65000000' + e18), stakeID: 1}, // #7
        ],
        totals: {
            // Total for every user
            tokenStaked: toBnArr([
                '40000000' + e18,
                '15000000' + e18,
                '80000000' + e18,
                '125000000' + e18,
            ]),
            tokenUnstaked: toBnArr([
                '40000000' + e18,
                '15000000' + e18,
                '80000000' + e18,
                '125000000' + e18,
            ]),
            rewardTokenVested: toBN('50000000' + e18),
            rewardTokenEntitled: toBnArr([
                '17687500' + e18,
                '12062500' + e18,
                '2000000' + e18,
                '18250000' + e18,
            ]),
            rewardTokenPaid: toBnArr([
                '17687500' + e18,
                '12062500' + e18,
                '2000000' + e18,
                '18250000' + e18,
            ]),
        },
        points: [
            {
                timestamp: startTime + 100, // point index: #0
                rewardTokenVested: 0n,
                stakesStaked: [0, 1],
                stakesUnstaked: null,
                stakedBalances: toBnArr(['10000000' + e18, 0, 0, 0]),
                sharesBalances: toBnArr(['10' + e18, 0, 0, 0]),
                rewardTokenEntitled: toBnArr([0, 0, 0, 0]),
                rewardTokenPaid: toBnArr([0, 0, 0, 0]),
                rewardTokenBalances: toBnArr([0, 0, 0, 0]),
                tokensPerShareScaled: 0n,
                offsets: toBnArr([0, 0, 0, 0]),
            },
            {
                timestamp: startTime + 100 + 8640, // #1
                rewardTokenVested: toBN('5000000' + e18),
                stakesStaked: [2, 3],
                stakesUnstaked: null,
                stakedBalances: toBnArr([
                    '10000000' + e18,
                    '15000000' + e18,
                    0,
                    0,
                ]),
                sharesBalances: toBnArr(['10' + e18, '15' + e18, 0, 0]),
                rewardTokenEntitled: toBnArr(['5000000' + e18, 0, 0, 0]),
                rewardTokenPaid: toBnArr([0, 0, 0, 0]),
                rewardTokenBalances: toBnArr(['5000000' + e18, 0, 0, 0]),
                tokensPerShareScaled: toBN('500000' + e9),
                offsets: toBnArr([0, '7500000' + e18, 0, 0]),
            },
            {
                timestamp: startTime + 100 + 25920, // #2
                rewardTokenVested: toBN('10000000' + e18),
                stakesStaked: null,
                stakesUnstaked: [0],
                stakedBalances: toBnArr([
                    '5000000' + e18,
                    '15000000' + e18,
                    0,
                    0,
                ]),
                sharesBalances: toBnArr(['5' + e18, '15' + e18, 0, 0]),
                rewardTokenEntitled: toBnArr([
                    '4000000' + e18,
                    '6000000' + e18,
                    0,
                    0,
                ]),
                rewardTokenPaid: toBnArr(['4500000' + e18, 0, 0, 0]),
                rewardTokenBalances: toBnArr([
                    '4500000' + e18,
                    '6000000' + e18,
                    0,
                    0,
                ]),
                tokensPerShareScaled: toBN('900000' + e9),
                offsets: toBnArr([0, '7500000' + e18, 0, 0]),
            },
            {
                timestamp: startTime + 100 + 34560, // #3
                rewardTokenVested: toBN('5000000' + e18),
                stakesStaked: [4],
                stakesUnstaked: null,
                stakedBalances: toBnArr([
                    '5000000' + e18,
                    '15000000' + e18,
                    0,
                    '60000000' + e18,
                ]),
                sharesBalances: toBnArr(['5' + e18, '15' + e18, 0, '60' + e18]),
                rewardTokenEntitled: toBnArr([
                    '1250000' + e18,
                    '3750000' + e18,
                    0,
                    0,
                ]),
                rewardTokenPaid: toBnArr([0, 0, 0, 0]),
                rewardTokenBalances: toBnArr([
                    '5750000' + e18,
                    '9750000' + e18,
                    0,
                    0,
                ]),
                tokensPerShareScaled: toBN('1150000' + e9),
                offsets: toBnArr([0, '7500000' + e18, 0, '69000000' + e18]),
            },
            {
                timestamp: startTime + 100 + 43200, // #4
                rewardTokenVested: toBN('5000000' + e18),
                stakesStaked: [5],
                stakesUnstaked: null,
                stakedBalances: toBnArr([
                    '5000000' + e18,
                    '15000000' + e18,
                    '80000000' + e18,
                    '60000000' + e18,
                ]),
                sharesBalances: toBnArr([
                    '5' + e18,
                    '15' + e18,
                    '80' + e18,
                    '60' + e18,
                ]),
                rewardTokenEntitled: toBnArr([
                    '312500' + e18,
                    '937500' + e18,
                    0,
                    '3750000' + e18,
                ]),
                rewardTokenPaid: toBnArr([0, 0, 0, 0]),
                rewardTokenBalances: toBnArr([
                    '6062500' + e18,
                    '10687500' + e18,
                    0,
                    '3750000' + e18,
                ]),
                tokensPerShareScaled: toBN('1212500' + e9),
                offsets: toBnArr([
                    0,
                    '7500000' + e18,
                    '97000000' + e18,
                    '69000000' + e18,
                ]),
            },
            {
                timestamp: startTime + 100 + 50112, // #5 (5..7 in the spreadsheet)
                rewardTokenVested: toBN('4000000' + e18),
                stakesStaked: [6],
                stakesUnstaked: [5, 3],
                stakedBalances: toBnArr([
                    '35000000' + e18,
                    '5000000' + e18,
                    0,
                    '60000000' + e18,
                ]),
                sharesBalances: toBnArr(['35' + e18, '5' + e18, 0, '60' + e18]),
                rewardTokenEntitled: toBnArr([
                    '125000' + e18,
                    '375000' + e18,
                    '2000000' + e18,
                    '1500000' + e18,
                ]),
                rewardTokenPaid: toBnArr([
                    0,
                    '7375000' + e18,
                    '2000000' + e18,
                    0,
                ]),
                rewardTokenBalances: toBnArr([
                    '6187500' + e18,
                    '3687500' + e18,
                    0,
                    '5250000' + e18,
                ]),
                tokensPerShareScaled: toBN('1237500' + e9),
                offsets: toBnArr([
                    '37125000' + e18,
                    '2500000' + e18,
                    0,
                    '69000000' + e18,
                ]),
            },
            {
                timestamp: startTime + 100 + 58752, // #6 (8 in the spreadsheet)
                rewardTokenVested: toBN('5000000' + e18),
                stakesStaked: null,
                stakesUnstaked: null,
                stakedBalances: toBnArr([
                    '35000000' + e18,
                    '5000000' + e18,
                    0,
                    '60000000' + e18,
                ]),
                sharesBalances: toBnArr(['35' + e18, '5' + e18, 0, '60' + e18]),
                rewardTokenEntitled: toBnArr([
                    '1750000' + e18,
                    '250000' + e18,
                    0,
                    '3000000' + e18,
                ]),
                rewardTokenPaid: toBnArr([0, 0, 0, 0]),
                rewardTokenBalances: toBnArr([
                    '7937500' + e18,
                    '3937500' + e18,
                    0,
                    '8250000' + e18,
                ]),
                tokensPerShareScaled: toBN('1287500' + e9),
                offsets: toBnArr([
                    '37125000' + e18,
                    '2500000' + e18,
                    0,
                    '69000000' + e18,
                ]),
            },
            {
                timestamp: startTime + 100 + 84672, // #7 (9..10 in the spreadsheet)
                rewardTokenVested: toBN('15000000' + e18),
                stakesStaked: [7],
                stakesUnstaked: [1, 2, 6],
                stakedBalances: toBnArr([0, 0, 0, '125000000' + e18]),
                sharesBalances: toBnArr([0, 0, 0, '125' + e18]),
                rewardTokenEntitled: toBnArr([0, 0, 0, 0]),
                rewardTokenPaid: toBnArr([
                    '13187500' + e18,
                    '4687500' + e18,
                    0,
                    0,
                ]),
                rewardTokenBalances: toBnArr([0, 0, 0, '17250000' + e18]),
                tokensPerShareScaled: toBN('1437500' + e9),
                offsets: toBnArr([0, 0, 0, '162437500' + e18]),
            },
            {
                timestamp: startTime + 100 + 86400, // #8 (11 in the spreadsheet)
                rewardTokenVested: toBN('1000000' + e18),
                stakesStaked: null,
                stakesUnstaked: [4, 7],
                stakedBalances: toBnArr([0, 0, 0, 0]),
                sharesBalances: toBnArr([0, 0, 0, 0]),
                rewardTokenEntitled: toBnArr([0, 0, 0, '1000000' + e18]),
                rewardTokenPaid: toBnArr([0, 0, 0, '18250000' + e18]),
                rewardTokenBalances: toBnArr([0, 0, 0, 0]),
                tokensPerShareScaled: toBN('1445500' + e9),
                offsets: toBnArr([0, 0, 0, 0]),
            },
        ],
    };
};
