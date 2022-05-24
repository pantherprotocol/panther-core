import {BigNumber, utils} from 'ethers';

import {CONFIRMATIONS_NUM} from '../utils/constants';
import {parseTxErrorMessage} from '../utils/errors';

import {getFaucetContract, getSignableContract} from './contracts';
import {notifyError} from './errors';
import {openNotification, removeNotification} from './notification';

export async function sendFaucetTransaction(
    library: any,
    chainId: number,
    account: string,
): Promise<Error | boolean> {
    const {contract} = getSignableContract(
        library,
        chainId,
        account,
        getFaucetContract,
    );

    let maxAmountToPay: BigNumber;
    try {
        maxAmountToPay = await contract.maxAmountToPay();
    } catch (err) {
        return notifyError(
            'Failed to prepare transaction',
            `Couldn't obtain maxAmountToPay from faucet at ${contract.address}`,
            err,
        );
    }
    console.debug(
        `Faucet had maxAmountToPay: ${utils.formatEther(maxAmountToPay)}`,
    );

    let tx: any;
    try {
        tx = await contract.drink(account, {
            value: maxAmountToPay,
        });
    } catch (err) {
        return notifyError(
            'Failed to submit transaction',
            parseTxErrorMessage(err),
            err,
        );
    }

    const inProgress = openNotification(
        'Transaction in progress',
        'Your faucet transaction is currently in progress. Please wait for confirmation!',
        'info',
    );

    try {
        const receipt = await tx.wait(CONFIRMATIONS_NUM);
        if (receipt.status === 0) {
            console.error('receipt: ', receipt);
            throw new Error(
                'Transaction failed on-chain without giving error details.',
            );
        }
    } catch (err) {
        removeNotification(inProgress);
        return notifyError('Transaction failed', parseTxErrorMessage(err), err);
    }

    removeNotification(inProgress);

    openNotification(
        'Faucet sending completed successfully',
        'Congratulations! Your faucet transaction was processed!',
        'info',
        15000,
    );

    return true;
}
