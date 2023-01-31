// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {BigNumber, Contract, utils} from 'ethers';
import {ContractTransaction} from 'ethers/lib/ethers';
import {DetailedError} from 'types/error';

import {getFaucetContract, getSignableContract} from './contracts';
import {MultiError} from './errors';

export async function craftSendFaucetTransaction(
    library: any,
    chainId: number,
    account: string,
): Promise<[BigNumber | MultiError<DetailedError>, Contract]> {
    const {contract} = getSignableContract(
        library,
        chainId,
        account,
        getFaucetContract,
    );

    let maxAmountToPay: BigNumber;
    try {
        maxAmountToPay = await contract.maxAmountToPay();
        console.debug(
            `Faucet had maxAmountToPay: ${utils.formatEther(maxAmountToPay)}`,
        );
        return [maxAmountToPay, contract];
    } catch (err) {
        return [
            new MultiError<DetailedError>({
                errorLabel: 'Failed to prepare transaction',
                message: `Couldn't obtain maxAmountToPay from faucet at ${contract.address}`,
                triggerError: err as Error,
            }),
            contract,
        ];
    }
}

export async function faucetDrink(
    contract: Contract,
    account: string,
    maxAmountToPay: BigNumber,
): Promise<ContractTransaction | MultiError> {
    try {
        return await contract.drink(account, {
            value: maxAmountToPay,
        });
    } catch (err) {
        // `err` will be an`RPC` error
        // Needs to be parsed first with `MultiError` then convert it into `DetailedError`
        return new MultiError(err).addErrorLabel(
            'Failed to submit transaction',
        );
    }
}
