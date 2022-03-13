// FIXME: slightly duplicated with dapp/src/utils/transactions.ts

import {Contract} from 'ethers';

// Finds first event with a given name from the transaction receipt
export async function getEventFromReceipt(
    receipt: any,
    contract: Contract,
    eventName: string,
): Promise<any> {
    if (!receipt) {
        return new Error('Failed to get transaction receipt.');
    }

    if (!receipt.logs) {
        return new Error('Failed to get transaction logs.');
    }

    for (const log of receipt.logs) {
        try {
            const parsed = contract.interface.parseLog(log);
            if (parsed.name == eventName) {
                return parsed;
            }
        } catch {}
    }
}
