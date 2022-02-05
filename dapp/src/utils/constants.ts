import {toBN} from './helpers';

export const DECIMALS = 18; //18 decimal places after floating point
export const E18 = toBN(10).pow(toBN(DECIMALS));
export const CONFIRMATIONS_NUM = 1;
export const CONFIRMATIONS_TIMEOUT = 60;
