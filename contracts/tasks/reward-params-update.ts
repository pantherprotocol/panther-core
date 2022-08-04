import fs from 'fs';
import {AdvancedStakeRewardController} from './../types/contracts/AdvancedStakeRewardController';
import {HardhatRuntimeEnvironment, TaskArguments} from 'hardhat/types';
import {task, types} from 'hardhat/config';
import {parseDate} from '../lib/units-shortcuts';
import {updateRewardParams} from '../lib/staking';
import daysJs from 'dayjs';
import _ from 'lodash';

const TASK_REWARDS_PARAMS_UPDATE = 'rewards:params:update';

function getDefinedTimeArgs(taskArgs: {[key: string]: string}): {
    startTime?: string;
    endTime?: string;
} {
    return _.pickBy(
        taskArgs,
        (value, key) => value && ['startTime', 'endTime'].includes(key),
    );
}

function normalizeDefinedTimeArgs(_definedTimes: any) {
    const definedTimes = {..._definedTimes};

    for (const param in definedTimes) {
        const [value, unit] = definedTimes[param]
            .replace(/\s+/g, ' ') // delete extra spaces ('1    hour' will be '1 hour')
            .trim()
            .split(' ');

        definedTimes[param] = daysJs()
            .add(+value, unit)
            .unix();
    }

    return definedTimes;
}

function normalizeJsonTimesArgs(_jsonParams: any) {
    const jsonParams = {..._jsonParams};

    for (const param of ['startTime', 'endTime']) {
        if (jsonParams[param] && typeof jsonParams[param] === 'string') {
            jsonParams[param] = parseDate(jsonParams[param]);
        }
    }

    return jsonParams;
}

async function getDefaultRewardParams(
    advancedStakeRewardController: AdvancedStakeRewardController,
    taskArgs: TaskArguments,
): Promise<AdvancedStakeRewardController.RewardParamsStruct> {
    const {startTime, endTime, startZkpApy, endZkpApy, prpPerStake} =
        await advancedStakeRewardController.rewardParams();

    return {
        startTime,
        endTime,
        startZkpApy: taskArgs.startZkpApy || startZkpApy,
        endZkpApy: taskArgs.endZkpApy || endZkpApy,
        prpPerStake: taskArgs.prpPerStake || prpPerStake,
    };
}

async function getRewardParams(
    advancedStakeRewardController: AdvancedStakeRewardController,
    taskArgs: {[key: string]: string},
): Promise<AdvancedStakeRewardController.RewardParamsStruct> {
    const {json} = taskArgs;

    const defaults = await getDefaultRewardParams(
        advancedStakeRewardController,
        taskArgs,
    );
    const jsonParams = json ? JSON.parse(fs.readFileSync(0).toString()) : {};
    const timeArgs = getDefinedTimeArgs(taskArgs);

    return {
        ...defaults,
        ...normalizeJsonTimesArgs(jsonParams),
        ...normalizeDefinedTimeArgs(timeArgs),
    };
}

task(TASK_REWARDS_PARAMS_UPDATE, 'Update advanced stake reward parameters')
    .addFlag('json', 'Accepts reward parameters from STDIN in JSON format')
    .addOptionalParam(
        'startTime',
        'Defines time when $ZKP rewards start to accrue',
        undefined,
        types.string,
    )
    .addOptionalParam(
        'endTime',
        'Defines time when $ZKP rewards accruals end',
        undefined,
        types.string,
    )
    .addOptionalParam(
        'startZkpApy',
        'Defines $ZKP reward APY at startTime',
        undefined,
        types.int,
    )
    .addOptionalParam(
        'endZkpApy',
        'Defines $ZKP reward APY at endTime',
        undefined,
        types.int,
    )
    .addOptionalParam(
        'prpPerStake',
        'Defines amount of PRP reward (per a stake)',
        undefined,
        types.int,
    )

    .setAction(
        async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
            const advancedStakeRewardController = (await hre.ethers.getContract(
                'AdvancedStakeRewardController',
            )) as AdvancedStakeRewardController;

            const params = await getRewardParams(
                advancedStakeRewardController,
                taskArgs,
            );

            await updateRewardParams(advancedStakeRewardController, params);
        },
    );
