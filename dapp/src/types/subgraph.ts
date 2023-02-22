export type GraphResponse =
    | AdvancedStakesGraphResponse
    | CommitmentsGraphResponse;

export type AdvancedStakesGraphResponse = {
    staker: {
        id: string;
        advancedStakingRewards: AdvancedStakeRewardsResponse[];
        lastBlockNumber: number;
        lastUpdatedTime: number;
    };
};

type Triad = {
    leafId: string;
    commitments: string[];
};

export type CommitmentsGraphResponse = {
    triads: Triad[];
};

export type AdvancedStakeRewardsResponse = {
    id: string;
    leftLeafId: string;
    creationTime: number;
    commitments: string[];
    utxoData: string;
    zZkpAmount: string;
    prpAmount: string;
};
