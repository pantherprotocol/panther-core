import axios from 'axios';

import {env} from './env';

type GraphResponse = AdvancedStakesGraphResponse | CommitmentsGraphResponse;

export type AdvancedStakesGraphResponse = {
    staker: {
        id: string;
        advancedStakingRewards: AdvancedStakeRewardsResponse[];
        lastBlockNumber: number;
        lastUpdatedTime: number;
    };
};

type CommitmentsGraphResponse = {
    triads: Triad[];
};

type Triad = {
    leafId: string;
    commitments: string[];
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

function getAdvancedStakingRewardQuery(staker: string): string {
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

function getMaxLeafIdQuery(): string {
    return `
    query{
        triads( orderBy: leafId, orderDirection: desc, first: 1) {
            leafId
        }
    }
    `;
}

// getCommitmentsQuery returns a query to fetch the commitments for a given
// slice of the leaf IDs specified by the start and end IDs. The subgraph has a
// limit returning maximum of 1000 commitments therefore there is a check to
// make sure the start and end IDs are within of the of each other.
function getCommitmentsQuery(
    startLeafId: number,
    endLeafId: number,
    limit = 1000,
): string {
    if (endLeafId - startLeafId > limit) {
        throw new Error(
            `The difference between the start and end leaf IDs must be less than ${limit}`,
        );
    }

    if (limit > 1000) throw 'Subgraph limit cannot be greater than 1000';

    return `
    query{
        triads(where:{leafId_gte: ${startLeafId}, leafId_lte: ${endLeafId}}, orderBy: leafId, first: ${limit}) {
            commitments
            leafId
          }
    }
    `;
}

// getGraphResponse returns the response from the subgraph for the given query
export async function getDataFromTheGraph(
    chainId: number,
    query: string,
): Promise<GraphResponse | Error> {
    const subgraphEndpoint = getSubgraphUrl(chainId);
    if (!subgraphEndpoint) {
        return new Error('No subgraph endpoint configured');
    }

    try {
        const data = await axios.post(subgraphEndpoint, {
            query,
        });

        if (data.data.errors?.[0]?.message) {
            return new Error(data.data.errors[0].message);
        }

        if (data.status !== 200) {
            return new Error(`Unexpected response status ${data.status}`);
        }

        return data.data.data;
    } catch (error) {
        return new Error(`Error on sending query to subgraph: ${error}`);
    }
}

// getSubgraphUrl returns randomly selected subgraph URL for a given chain ID
export function getSubgraphUrl(chainId: number): string | undefined {
    const subgraphAccountStr = env[`SUBGRAPH_ACCOUNTS_${chainId}`];
    if (!subgraphAccountStr) return undefined;
    const accountArray = subgraphAccountStr.split(',');
    const randomAccount =
        accountArray[Math.floor(Math.random() * accountArray.length)];
    console.debug('Using subgraph random account', randomAccount);
    return `https://api.thegraph.com/subgraphs/name/${randomAccount}`;
}

export async function getAdvancedStakingReward(
    chainId: number,
    address: string,
): Promise<AdvancedStakesGraphResponse | Error> {
    const query = getAdvancedStakingRewardQuery(address);
    return (await getDataFromTheGraph(chainId, query)) as
        | AdvancedStakesGraphResponse
        | Error;
}

export async function getMaxLeafId(chainId: number): Promise<number | Error> {
    const query = getMaxLeafIdQuery();
    const response = await getDataFromTheGraph(chainId, query);

    if (response instanceof Error) {
        return response;
    }

    const leafId = (response as CommitmentsGraphResponse).triads[0].leafId;
    return Number(leafId);
}

export async function getCommitments(
    chainId: number,
    startLeafId: number,
    endLeafId: number,
): Promise<string[] | Error> {
    const query = getCommitmentsQuery(startLeafId, endLeafId);
    const response = await getDataFromTheGraph(chainId, query);

    if (response instanceof Error) {
        return response;
    }

    const commitments = (response as CommitmentsGraphResponse).triads.flatMap(
        triad => triad.commitments,
    );

    return commitments;
}
