import {env} from './env';

export type GraphResponse = {
    staker: {
        id: string;
        advancedStakingRewards: AdvancedStakeRewardsResponse[];
        lastBlockNumber: number;
        lastUpdatedTime: number;
    };
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

export function getAdvancedStakingRewardQuery(staker: string): string {
    return `
    query{
        staker(id:"${staker.toLowerCase()}") {
          id
          lastUpdatedTime
          lastBlockNumber
          advancedStakingRewards {
            id
            creationTime
            commitments
            utxoData
            zZkpAmount
          }
        }
      }
     `;
}

export function getSubgraphUrl(chainId: number): string | undefined {
    return env[`SUBGRAPH_URL_${chainId}`];
}
