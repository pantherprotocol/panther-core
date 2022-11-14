import {BigNumber, Contract, utils} from 'ethers';
import {ContractTransaction} from 'ethers/lib/ethers';
import {DetailedError} from 'types/error';

import {getFaucetContract, getSignableContract} from './contracts';
import {parseTxErrorMessage} from './errors';

export async function craftSendFaucetTransaction(
    library: any,
    chainId: number,
    account: string,
): Promise<[BigNumber | DetailedError, Contract]> {
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
            {
                message: 'Failed to prepare transaction',
                details: `Couldn't obtain maxAmountToPay from faucet at ${contract.address}`,
                triggerError: err as Error,
            } as DetailedError,
            contract,
        ];
    }
}

export async function faucetDrink(
    contract: Contract,
    account: string,
    maxAmountToPay: BigNumber,
): Promise<ContractTransaction | DetailedError> {
    try {
        return await contract.drink(account, {
            value: maxAmountToPay,
        });
    } catch (err) {
        return {
            message: 'Failed to submit transaction',
            details: parseTxErrorMessage(err),
            triggerError: err,
        } as DetailedError;
    }
}
