import fs from 'fs';

import daysJs from 'dayjs';
import {task, types} from 'hardhat/config';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import _ from 'lodash';

import {isLocal} from '../../lib/checkNetwork';
import {parseDate} from '../../lib/units-shortcuts';
import {PantherPoolV0} from '../../types/contracts/PantherPoolV0';

const TASK_POOL_TIME_UPDATE = 'pool:time:update';

type ExitTimes = {
    exitTime?: number;
    exitDelay?: number;
};

function normalizeExitTimeArg(exitTime: any): ExitTimes | undefined {
    if (!exitTime) return;

    const [value, unit] = exitTime
        .replace(/\s+/g, ' ') // delete extra spaces ('1    hour' will be '1 hour')
        .trim()
        .split(' ');

    exitTime = daysJs()
        .add(+value, unit)
        .unix();

    return {exitTime};
}

function normalizeJsonTimeArgs(_jsonParams: any): ExitTimes {
    const jsonParams = {..._jsonParams};

    if (jsonParams['exitTime'] && typeof jsonParams['exitTime'] === 'string') {
        jsonParams['exitTime'] = parseDate(jsonParams['exitTime']);
    }

    return jsonParams;
}

async function getDefaultTimes(
    pantherPoolV0: PantherPoolV0,
): Promise<ExitTimes> {
    let exitTime: number, exitDelay: number;

    try {
        [exitTime, exitDelay] = await Promise.all([
            await pantherPoolV0.exitTime(),
            await pantherPoolV0.exitDelay(),
        ]);
    } catch (error: any) {
        throw new Error(
            `Error on reading times from panther pool V0 ${error.message}`,
        );
    }

    return {
        exitTime: +(process.env.POOL_EXIT_TIME as string) || exitTime,
        exitDelay: +(process.env.POOL_EXIT_DELAY as string) || exitDelay,
    };
}

async function getExitTimes(
    pantherPool: PantherPoolV0,
    taskArgs: {[key: string]: string},
): Promise<ExitTimes> {
    const {json} = taskArgs;

    const defaults = await getDefaultTimes(pantherPool);
    const jsonParams = json ? JSON.parse(fs.readFileSync(0).toString()) : {};

    return {
        ...defaults,
        ...normalizeJsonTimeArgs(jsonParams),
        ...normalizeExitTimeArg(taskArgs.exitTime),
    };
}

function printTimes(exitTimes: ExitTimes) {
    console.log('Updating the exit times as follows');
    console.log(
        'Exit time: ',
        exitTimes.exitTime,
        `(${new Date((exitTimes.exitTime as number) * 1000).toUTCString()})`,
    );
    console.log('Exit delay: ', exitTimes.exitDelay);
}

task(TASK_POOL_TIME_UPDATE, 'Update the panther pool exit time')
    .addOptionalParam('exitTime', 'The new exit time', undefined, types.string)
    .addOptionalParam(
        'exitDelay',
        'The new exit delay',
        undefined,
        types.string,
    )
    .addFlag('json', 'Accepts time from STDIN in JSON format')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const [deployer] = await hre.ethers.getSigners();
        const pantherPool = (await hre.ethers.getContract(
            'PantherPoolV0',
        )) as PantherPoolV0;

        console.log('Using PantherPool contract: ', pantherPool.address);

        let {exitTime, exitDelay} = await getExitTimes(pantherPool, taskArgs);

        if (isLocal(hre)) {
            if (!exitTime) exitTime = Math.ceil(Date.now() / 1000) + 60;
            if (!exitDelay) exitDelay = 60;
        }

        if (!exitTime) throw new Error('Undefined exit time');
        if (!exitDelay) throw new Error('Undefined exit delay');

        printTimes({exitTime, exitDelay});

        const data = pantherPool.interface.encodeFunctionData(
            'updateExitTimes',
            [exitTime, exitDelay],
        );

        const tx = await deployer.sendTransaction({
            to: pantherPool.address,
            data,
        });

        console.log('Transaction is sent. Waiting for 1 confirmation...');

        const receipt = await tx.wait();
        console.log('Transaction is confirmed.', receipt);
    });
