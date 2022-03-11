import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task} from 'hardhat/config';
import {BigNumber, Event} from 'ethers';
import fs from 'fs';
import {filterPaginator} from '../lib/utils';

const QUERY_BLOCKS = 1000;

async function extractLogData(
    hre: HardhatRuntimeEnvironment,
    event: Event,
): Promise<
    | {
          blockNumber: number;
          timestamp: number;
          date: string;
          transactionHash: string;
          address: string;
          stakeID: BigNumber;
          amount: BigNumber;
          lockedTill: BigNumber;
      }
    | undefined
> {
    const block = await hre.ethers.provider.getBlock(event.blockNumber);
    const date = new Date(block.timestamp * 1000);
    const args = event?.args;
    if (args) {
        return {
            blockNumber: event.blockNumber,
            timestamp: block.timestamp,
            date: date.toString(),
            transactionHash: event.transactionHash,
            address: args[0],
            stakeID: args.stakeID?.toString(),
            amount: args.amount?.toString(),
            lockedTill: args.lockedTill?.toString(),
        };
    }
}

task('staking:list', 'Output staking events data as JSON')
    .addParam('address', 'Staking contract address')
    .addParam('start', 'Starting block number to look from')
    .addParam('out', 'File to write to')
    .addOptionalParam('end', 'Ending block number to look to')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const stakingContract = await hre.ethers.getContractAt(
            'Staking',
            taskArgs.address,
        );

        const filter = stakingContract.filters.StakeCreated();
        let endBlock;

        if (taskArgs.end) {
            endBlock = Number(taskArgs.end);
        } else {
            endBlock = (await hre.ethers.provider.getBlock('latest')).number;
        }

        const logs = await filterPaginator(
            Number(taskArgs.start),
            endBlock,
            QUERY_BLOCKS,
            stakingContract,
            filter,
            extractLogData,
            hre,
        );

        console.log(logs);
        if (taskArgs.out) {
            fs.writeFileSync(taskArgs.out, JSON.stringify(logs, null, 2));
            console.log('Wrote to', taskArgs.out);
        }
    });
