import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task} from 'hardhat/config';
import {BigNumber, Event} from 'ethers';
import fs from 'fs';

// import {abi as REWARD_POOL_ABI} from '../deployments/ARCHIVE/production/artifacts/contracts/MaticRewardPool.sol/MaticRewardPool.json';
const REWARD_POOL_ADDRESS = '0x773d49309c4E9fc2e9254E7250F157D99eFe2d75';
const FIRST_VESTED_BLOCK = 25768523;
const QUERY_BLOCKS = 1000;

async function extractLogData(
    hre: HardhatRuntimeEnvironment,
    event: Event,
): Promise<{
    timestamp: number;
    date: string;
    transactionHash: string;
    amount: BigNumber;
}> {
    const block = await hre.ethers.provider.getBlock(event.blockNumber);
    const date = new Date(block.timestamp * 1000);
    return {
        timestamp: block.timestamp,
        date: date.toString(),
        transactionHash: event.transactionHash,
        amount: event?.args?.amount?.toString(),
    };
}

task('vesting:list', 'Output vesting data as JSON')
    .addOptionalParam('out', 'File to write to')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        // const rewardPool = await hre.ethers.getContract('MaticRewardPool');
        const rewardPool = await hre.ethers.getContractAt(
            'MaticRewardPool',
            REWARD_POOL_ADDRESS,
        );

        const filter = rewardPool.filters.Vested();
        const logs = [];
        let queryStartBlock = FIRST_VESTED_BLOCK;
        const currentBlock = (await hre.ethers.provider.getBlock('latest'))
            .number;

        console.log('Current block:', currentBlock);
        while (queryStartBlock < currentBlock) {
            let queryEndBlock;
            if (queryStartBlock + QUERY_BLOCKS - 1 < currentBlock) {
                queryEndBlock = queryStartBlock + QUERY_BLOCKS - 1;
            } else {
                queryEndBlock = currentBlock;
            }

            console.log(
                'Fetching Vested events from blocks',
                queryStartBlock,
                'to',
                queryEndBlock,
                ' ...',
            );
            const newLogs = await rewardPool.queryFilter(
                filter,
                queryStartBlock,
                queryEndBlock,
            );
            for await (const newLog of newLogs) {
                logs.push(await extractLogData(hre, newLog));
            }
            console.log(`   Got ${newLogs.length} events`);
            queryStartBlock += QUERY_BLOCKS;
        }
        console.log(logs);
        if (taskArgs.out) {
            fs.writeFileSync(taskArgs.out, JSON.stringify(logs, null, 2));
            console.log('Wrote to', taskArgs.out);
        }
    });
