import fs from 'fs';

import {NewCommitmentEvent} from '@panther-core/crypto/lib/types/commitments';
import {filterPaginator} from '@panther-core/crypto/lib/utils/paginator';
// eslint-disable-next-line
import {Event} from 'ethers';
import {task} from 'hardhat/config';
import {HardhatRuntimeEnvironment, HttpNetworkConfig} from 'hardhat/types';

const QUERY_BLOCKS = 500;

const POOL_MINIMAL_ABI = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint256',
                name: 'leftLeafId',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'creationTime',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'bytes32[3]',
                name: 'commitments',
                type: 'bytes32[3]',
            },
            {
                indexed: false,
                internalType: 'bytes',
                name: 'utxoData',
                type: 'bytes',
            },
        ],
        name: 'NewCommitments',
        type: 'event',
    },
];

async function extractLogData(
    hre: HardhatRuntimeEnvironment,
    event: Event,
): Promise<NewCommitmentEvent | undefined> {
    const block = await hre.ethers.provider.getBlock(event.blockNumber);
    const tx = await hre.ethers.provider.getTransaction(event.transactionHash);
    const date = new Date(block.timestamp * 1000);
    const args = event?.args;
    if (args) {
        return {
            name: event.event ?? '',
            address: tx.from,
            leftLeafId: args.leftLeafId.toString(),
            creationTime: args.creationTime.toString(),
            commitments: args.commitments,
            utxoData: args.utxoData,
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            blockTimestamp: block.timestamp,
            date: date.toString(),
        };
    }
}

function writeEvents(outFile: string, events: any) {
    if (!outFile) return;
    fs.writeFileSync(outFile, JSON.stringify(events, null, 2));
    console.log(`Wrote ${events.length} events to ${outFile}`);
}

function filePrefixes(
    out: string,
    chunksPrefix: string,
    address: string,
    network: string,
): [string, string] {
    const filePrefix = `${chunksPrefix}-${address}-${network}`;
    const chinksPrefix = `${out}/chunks`;
    return [filePrefix, chinksPrefix];
}

function scanDownloadedEvents(
    fileNamePrefix: string,
    path: string,
): [NewCommitmentEvent[], number | undefined] {
    const events: NewCommitmentEvent[] = [];
    let latestScannedBlock: number | undefined;

    const chunksFolder = `${path}/chunks`;
    console.log('Looking for previously downloaded chunks...');

    if (fs.existsSync(chunksFolder)) {
        latestScannedBlock = 0;
        const files = fs
            .readdirSync(chunksFolder)
            .filter((f: string) => f.startsWith(fileNamePrefix));
        console.log(
            `Found ${files.length} chunks with prefix: ${fileNamePrefix}`,
        );

        for (const file of files) {
            const data = fs.readFileSync(`${chunksFolder}/${file}`);
            const chunkEvents = JSON.parse(data.toString());
            events.push(...chunkEvents);

            const endBlockNumber = parseInt(file.split('-').pop() as string);
            if (!latestScannedBlock || endBlockNumber > latestScannedBlock) {
                latestScannedBlock = endBlockNumber;
            }
        }
    } else {
        console.log(`${chunksFolder} not found. No downloaded chunks...`);
    }

    return [events, latestScannedBlock];
}

task('commitments-list', 'Saves NewCommitments as JSON')
    .addParam('address', 'Pool contract address')
    .addParam('start', 'Starting block number to look from')
    .addParam('out', 'File to write to (folder)')
    .addParam('chunksPrefix', 'Prefix of files to write chunks to')
    .addOptionalParam('end', 'Ending block number to look to (inclusive)')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const contract = new hre.ethers.Contract(
            taskArgs.address,
            POOL_MINIMAL_ABI,
            hre.ethers.provider,
        );

        console.log(
            'Connecting to',
            hre.network.name,
            'via ',
            (hre.network.config as HttpNetworkConfig).url,
        );

        const filter = contract.filters['NewCommitments']();
        // end block is included and will be checked, i.e.,
        // filtering in [startBlock, endBlock]
        const endBlock = taskArgs.end
            ? Number(taskArgs.end)
            : (await hre.ethers.provider.getBlock('latest')).number;

        const [fileNamePrefix, chunksFolder] = filePrefixes(
            taskArgs.out,
            taskArgs.chunksPrefix,
            taskArgs.address,
            hre.network.name,
        );

        if (!fs.existsSync(chunksFolder)) {
            fs.mkdirSync(chunksFolder, {recursive: true});
        }

        const chunkWriter = (
            events: any[],
            startBlock: number,
            endBlock: number,
        ) => {
            process.stdout.write('\t');
            writeEvents(
                `${chunksFolder}/${fileNamePrefix}-blocks-${startBlock}-${endBlock}.json`,
                events,
            );
        };

        const [downloadedEvents, latestScannedBlock] = scanDownloadedEvents(
            fileNamePrefix,
            taskArgs.out,
        );

        if (latestScannedBlock) {
            console.log(
                `Found ${downloadedEvents.length} downloaded events`,
                `with the latest scanned block #${latestScannedBlock}`,
            );
        }

        const startingBlock =
            latestScannedBlock && latestScannedBlock > Number(taskArgs.start)
                ? latestScannedBlock + 1
                : Number(taskArgs.start);

        const newEvents = await filterPaginator(
            startingBlock,
            endBlock,
            QUERY_BLOCKS,
            contract,
            filter,
            extractLogData,
            hre,
            chunkWriter,
        );

        const allEvents = [...downloadedEvents, ...newEvents].sort((a, b) => {
            return a.blockNumber - b.blockNumber;
        });

        console.log(`Fetched the events from contract: ${taskArgs.address}`);
        writeEvents(`${taskArgs.out}/${fileNamePrefix}-full.json`, allEvents);
    });
