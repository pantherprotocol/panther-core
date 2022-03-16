import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {Contract, EventFilter, Event} from 'ethers';

export async function filterPaginator(
    startBlock: number,
    endBlock: number,
    blockSize: number,
    contract: Contract,
    filter: EventFilter,
    extractLogData: (hre: HardhatRuntimeEnvironment, e: Event) => Promise<any>,
    hre: HardhatRuntimeEnvironment,
    postChunkHook?: (events: any, startBlock: number, endBlock: number) => void,
): Promise<any> {
    console.log('Querying events from the contract...');
    console.log('\tStart block:', startBlock);
    console.log('\tEnd block:', endBlock);
    console.log('\tChunk size:', blockSize, 'blocks');

    const allEvents = [];
    let queryStartBlock = startBlock;
    let idx = 1;
    const size = Math.ceil((endBlock + 1 - queryStartBlock) / blockSize);

    while (queryStartBlock <= endBlock) {
        const chunkEvents: any[] = [];
        const queryEndBlock = Math.min(
            queryStartBlock + blockSize - 1,
            endBlock,
        );

        console.log(
            idx,
            'of',
            size,
            ': from block',
            queryStartBlock,
            'to',
            queryEndBlock,
            '...',
        );
        const newEvents = await contract.queryFilter(
            filter,
            queryStartBlock,
            queryEndBlock,
        );
        for await (const newEvent of newEvents) {
            const rec = await extractLogData(hre, newEvent);
            if (rec) {
                allEvents.push(rec);
                chunkEvents.push(rec);
            }
        }
        console.log(`\tGot ${newEvents.length} events`);
        if (postChunkHook) {
            postChunkHook(chunkEvents, queryStartBlock, queryEndBlock);
        }
        queryStartBlock += blockSize;
        idx++;
    }
    return allEvents;
}
