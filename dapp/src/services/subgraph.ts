// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

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

// getGraphResponse returns the response from the subgraph for the given query.
// The subgraph is queried for the given chain ID and the query is retried for
// each of the subgraph accounts until a valid response is received. If no
// response is received then an error is thrown.
export async function getDataFromTheGraph(
    chainId: number,
    query: string,
    subgraphUrlIndex?: number,
    retry = 0,
): Promise<GraphResponse | Error> {
    const subgraphAccountArray = getSubgraphAccounts(chainId);
    if (subgraphAccountArray == undefined) {
        return new Error('Subgraph accounts are not yet defined');
    }

    const urlIndex =
        subgraphUrlIndex == undefined
            ? Math.floor(Math.random() * subgraphAccountArray.length) // random index
            : subgraphUrlIndex;

    const subgraphEndpoint = getSubgraphUrl(chainId, urlIndex);
    if (!subgraphEndpoint) {
        return new Error('No subgraph endpoint configured');
    }

    try {
        const data = await axios.post(subgraphEndpoint, {
            query,
        });

        if (data.data.errors?.[0]?.message || data.status !== 200) {
            throw new Error('Cannot fetch data from the subgraph');
        }

        return data.data.data;
    } catch (error) {
        console.debug(
            `The subgraph account ${subgraphAccountArray[urlIndex]} failed to respond with the following error: ${error}`,
        );
        if (retry < subgraphAccountArray.length - 1) {
            const newSubgraphUrlIndex =
                (urlIndex + 1) % subgraphAccountArray.length;
            console.debug(
                'Retrying with different subgraph account',
                subgraphAccountArray[newSubgraphUrlIndex],
            );
            return await getDataFromTheGraph(
                chainId,
                query,
                newSubgraphUrlIndex,
                retry + 1,
            );
        }

        return new Error('Error on sending query to all subgraph accounts');
    }
}

// getSubgraphUrl returns randomly selected subgraph URL for a given chain ID or
// specified by the index (i.e. not random)
export function getSubgraphUrl(
    chainId: number,
    index: number,
): string | undefined {
    const accountArray = getSubgraphAccounts(chainId);
    if (!accountArray) return undefined;
    const selectedAccount = accountArray[index];
    console.debug('Using subgraph account', selectedAccount);
    return `https://api.thegraph.com/subgraphs/name/${selectedAccount}`;
}

function getSubgraphAccounts(chainId: number): string[] | undefined {
    const subgraphAccountStr = env[`SUBGRAPH_ACCOUNTS_${chainId}`];
    if (!subgraphAccountStr) return undefined;
    return subgraphAccountStr.split(',');
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
