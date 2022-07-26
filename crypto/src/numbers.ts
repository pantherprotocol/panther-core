import {BigNumber, BigNumberish, constants} from 'ethers';

export const sumBigNumbers = (
    arr: BigNumberish[],
    initialValue = constants.Zero,
) => {
    return arr
        .map((e: BigNumberish) => BigNumber.from(e))
        .reduce((total, e) => total.add(e), initialValue);
};
