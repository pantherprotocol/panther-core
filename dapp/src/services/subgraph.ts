export function getAdvancedStakingRewardQuery(staker: string): string {
    return `
    query{
        staker(id:"${staker.toLowerCase()}") {
          id
          lastUpdatedTime
          lastBlockNumber
          advancedStakingRewards {
            id
            leftLeafId
            creationTime
            commitments
            zZkpAmount
            prpAmount
          }
        }
      }
     `;
}
