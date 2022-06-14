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
            prpAmount
          }
        }
      }
     `;
}
