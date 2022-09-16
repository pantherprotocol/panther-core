// FIXME: duplicated with contracts/lib/events.ts
import type {ContractReceipt, ContractTransaction} from 'ethers';

import {CONFIRMATIONS_NUM} from './constants';

// Finds first event with a given name from the transaction receipt
export async function getEventFromReceipt(
    receipt: ContractReceipt,
    eventName: string,
): Promise<any> {
    if (!receipt) {
        return new Error('Failed to get transaction receipt.');
    }

    if (!receipt.events) {
        return new Error('Failed to get transaction events.');
    }

    const event = receipt.events.find(({event}) => event === eventName);
    if (!event) {
        return new Error(`No ${eventName} event found for this transaction.`);
    }

    console.debug(`${eventName} event: ${JSON.stringify(event)}`);

    return event;
}

export async function awaitConfirmationAndRetrieveEvent(
    transaction: ContractTransaction,
    eventName: string,
): Promise<any | Error> {
    let receipt;
    try {
        receipt = await transaction.wait(CONFIRMATIONS_NUM);
    } catch (err) {
        return new Error(`Transaction rejected!`);
    }
    return await getEventFromReceipt(receipt, eventName);
}
