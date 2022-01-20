import {utils} from 'ethers';

export const hash4bytes = (s: string) => utils.id(s).slice(0, 10);
export const hash4bytesArray = (s: string) =>
    utils.arrayify(utils.id(s)).slice(0, 4);

export const CLASSIC = 'classic';
export const STAKE = 'stake';
export const UNSTAKE = 'unstake';

export const classicActionHash = (action: string) => {
    const combined = utils.concat([
        hash4bytesArray(action),
        hash4bytesArray(CLASSIC),
    ]);
    return utils.keccak256(combined).slice(0, 10);
};
