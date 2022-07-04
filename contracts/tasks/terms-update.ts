import fs from 'fs';
import {
    TestnetStaking,
    IStakingTypes,
} from './../types/contracts/TestnetStaking';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task, types} from 'hardhat/config';
import {parseDate} from '../lib/units-shortcuts';
import {updateTerms} from '../lib/staking';
import {hash4bytes} from '../lib/hash';
import daysJs from 'dayjs';
import _ from 'lodash';

const TASK_TERMS_UPDATE = 'terms:update';

function validateStakeType(type: string) {
    if (type !== 'advanced' && type !== 'classic')
        throw new Error('Unknown type');
}

function getDefinedTimeArgs(taskArgs: {[key: string]: string}): {
    allowedSince?: string;
    allowedTill?: string;
    lockedTill?: string;
} {
    return _.pickBy(
        taskArgs,
        (value, key) =>
            value &&
            ['allowedSince', 'allowedTill', 'lockedTill'].includes(key),
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

function normalizeTermParams(_jsonParams: any) {
    const jsonParams = {..._jsonParams};

    for (const param of ['allowedSince', 'allowedTill', 'lockedTill']) {
        if (jsonParams[param] && typeof jsonParams[param] === 'string') {
            jsonParams[param] = parseDate(jsonParams[param]);
        }
    }

    return jsonParams;
}

async function getDefaultParams(
    staking: TestnetStaking,
    stakeType: string,
): Promise<any> {
    const {
        isEnabled,
        isRewarded,
        minAmountScaled,
        maxAmountScaled,
        allowedSince,
        allowedTill,
        lockedTill,
        exactLockPeriod,
        minLockPeriod,
    } = await staking.terms(hash4bytes(stakeType));

    return {
        isEnabled,
        isRewarded,
        minAmountScaled,
        maxAmountScaled,
        allowedSince,
        allowedTill,
        lockedTill,
        exactLockPeriod,
        minLockPeriod,
    };
}

async function getTerms(
    staking: TestnetStaking,
    taskArgs: {[key: string]: string},
): Promise<IStakingTypes.TermsStruct> {
    const {json, type} = taskArgs;

    const defaults = await getDefaultParams(staking, type);
    const jsonParams = json ? JSON.parse(fs.readFileSync(0).toString()) : {};
    const timeArgs = getDefinedTimeArgs(taskArgs);

    return {
        ...defaults,
        ...normalizeTermParams(jsonParams),
        ...normalizeDefinedTimeArgs(timeArgs),
    };
}

task(TASK_TERMS_UPDATE, 'Update terms for Testnet Staking contract')
    .addParam(
        'type',
        'Defines the staking type that terms will be added for. it can be classic or advanced.',
        undefined,
        types.string,
    )
    .addParam(
        'json',
        'Accepts pool parameters from STDIN in JSON format',
        false,
        types.boolean,
    )
    .addOptionalParam(
        'allowedSince',
        'Defines when stake is opened',
        undefined,
        types.string,
    )
    .addOptionalParam(
        'allowedTill',
        'Defines when stake is closed',
        undefined,
        types.string,
    )
    .addOptionalParam(
        'lockedTill',
        'Defines when unstake is opened',
        undefined,
        types.string,
    )

    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        validateStakeType(taskArgs.type);

        const staking = (await hre.ethers.getContract(
            'Staking',
        )) as TestnetStaking;

        const terms = await getTerms(staking, taskArgs);

        await updateTerms(staking, terms, taskArgs.type);
    });
