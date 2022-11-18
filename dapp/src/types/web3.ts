// This is not available for import:
//
//   export {Web3ReactContextInterface} from '@web3-react/core/types';
//
// so we have to copy the declarations into our own repo:

interface Web3ReactManagerFunctions {
    activate: (
        connector: any,
        onError?: (error: Error) => void,
        throwErrors?: boolean,
    ) => Promise<void>;
    setError: (error: Error) => void;
    deactivate: () => void;
}

export interface Web3ReactContextInterface<T = any>
    extends Web3ReactManagerFunctions {
    connector?: any;
    library?: T;
    chainId?: number;
    account?: null | string;
    active: boolean;
    error?: Error;
}
