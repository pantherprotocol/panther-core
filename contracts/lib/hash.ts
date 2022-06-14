import {utils} from 'ethers';

export const hash4bytes = (s: string) => utils.id(s).slice(0, 10);
export const hash4bytesArray = (s: string) =>
    utils.arrayify(utils.id(s)).slice(0, 4);

export const CLASSIC = 'classic';
export const ADVANCED = 'advanced';
export const STAKE = 'stake';
export const UNSTAKE = 'unstake';

const combinedHash = (action: string, type: string) => {
    const combined = utils.concat([
        hash4bytesArray(action),
        hash4bytesArray(type),
    ]);
    return utils.keccak256(combined).slice(0, 10);
};

export const classicActionHash = (action: string) =>
    combinedHash(action, CLASSIC);

export const advancedActionHash = (action: string) =>
    combinedHash(action, ADVANCED);
