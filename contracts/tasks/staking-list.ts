import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task} from 'hardhat/config';
import {BigNumber, Event} from 'ethers';
import fs from 'fs';
import {filterPaginator} from '../lib/paginator';

const QUERY_BLOCKS = 500;

async function extractLogData(
    hre: HardhatRuntimeEnvironment,
    event: Event,
): Promise<
    | {
          name: string | undefined;
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
            name: event.event,
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

function writeEvents(outFile: string, events: any) {
    if (!outFile) return;
    fs.writeFileSync(outFile, JSON.stringify(events, null, 2));
    console.log('Wrote to', outFile);
}

task('staking:list', 'Output staking events data as JSON')
    .addParam('address', 'Staking contract address')
    .addParam('start', 'Starting block number to look from')
    .addParam('filter', 'Event name to filter on: StakeCreated or StakeClaimed')
    .addOptionalParam('out', 'File to write to')
    .addOptionalParam('chunksPrefix', 'Prefix of files to write chunks to')
    .addOptionalParam('end', 'Ending block number to look to')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        if (!taskArgs.out && !taskArgs.chunksPrefix) {
            console.error(
                'Must provide at least one of --out and --chunksPrefix.',
            );
            process.exit(1);
        }

        const stakingContract = await hre.ethers.getContractAt(
            'Staking',
            taskArgs.address,
        );
        console.log(
            'Connecting to',
            hre.network.name,
            'with params:',
            hre.network.config,
        );

        const filter = stakingContract.filters[taskArgs.filter]();
        const endBlock = taskArgs.end
            ? Number(taskArgs.end)
            : (await hre.ethers.provider.getBlock('latest')).number;

        const chunkWriter = (
            events: any[],
            startBlock: number,
            endBlock: number,
        ) => {
            if (!taskArgs.chunksPrefix) return;
            process.stdout.write('\t');
            writeEvents(
                `${taskArgs.chunksPrefix}-${startBlock}-${endBlock}.json`,
                events,
            );
        };

        const logs = await filterPaginator(
            Number(taskArgs.start),
            endBlock,
            QUERY_BLOCKS,
            stakingContract,
            filter,
            extractLogData,
            hre,
            chunkWriter,
        );

        console.log(logs);
        writeEvents(taskArgs.out, logs);
    });
