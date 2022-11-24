import fs from 'fs';

import {task, types} from 'hardhat/config';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {addTerms, StakeType} from '../../lib/staking';
import {parseDate} from '../../lib/units-shortcuts';

import {Staking, IStakingTypes} from './../../types/contracts/Staking';

const TASK_TERMS_ADD = 'terms:add';

function normalizeTermParams(_params: any) {
    const params = {..._params};

    for (const param of ['allowedSince', 'allowedTill', 'lockedTill']) {
        if (params[param] && typeof params[param] === 'string') {
            params[param] = parseDate(params[param]);
        }
    }

    return params;
}

function getDefaultTermParams(): IStakingTypes.TermsStruct {
    return {
        isEnabled: true,
        isRewarded: true,
        minAmountScaled: 0,
        maxAmountScaled: 0,
        allowedSince: 0,
        allowedTill: 0,
        lockedTill: 0,
        exactLockPeriod: 0,
        minLockPeriod: 3600,
    };
}

function getDefaultClassicParams() {
    return {...getDefaultTermParams(), minLockPeriod: 86400};
}

function getDefaultAdvancedParams() {
    const now = Math.floor(new Date().getTime() / 1000);
    const day = 86400;

    const allowedTill = now + day * 5;

    return {
        ...getDefaultTermParams(),
        minAmountScaled: 100,
        allowedSince: now,
        allowedTill,
    };
}

function getTerms(
    stakeType: StakeType,
    useJSON: boolean,
): IStakingTypes.TermsStruct {
    const overrides = useJSON ? JSON.parse(fs.readFileSync(0).toString()) : {};
    let defaults: IStakingTypes.TermsStruct;

    if (stakeType == 'advanced') {
        defaults = getDefaultAdvancedParams();
    } else if (stakeType == 'classic') {
        defaults = getDefaultClassicParams();
    } else {
        throw new Error(`Unknown type: ${stakeType}`);
    }

    return {
        ...normalizeTermParams(defaults),
        ...normalizeTermParams(overrides),
    };
}

task(TASK_TERMS_ADD, 'Adds terms to staking contract')
    .addParam(
        'type',
        'Defines the staking type that terms will be added for. it can be classic or advanced.',
        undefined,
        types.string,
    )
    .addParam(
        'json',
        'Accept pool parameters from STDIN in JSON format',
        false,
        types.boolean,
    )

    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const terms = getTerms(taskArgs.type, taskArgs.json);

        const staking = (await hre.ethers.getContract('Staking')) as Staking;

        await addTerms(staking, terms, taskArgs.type);
    });
