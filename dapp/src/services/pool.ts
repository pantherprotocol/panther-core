import {
    generateMerkleProof,
    TriadMerkleTree,
    triadTreeMerkleProofToPathElements,
} from '@panther-core/crypto/lib/other/triad-merkle-tree';
import {deriveSpendingChildKeypair} from '@panther-core/crypto/lib/panther/keys';
import {decryptRandomSecret} from '@panther-core/crypto/lib/panther/messages';
import {IKeypair, PrivateKey} from '@panther-core/crypto/lib/types/keypair';
import {
    bytesToHexString32,
    bigintToBytes32,
    bigintToBytes,
} from '@panther-core/crypto/lib/utils/bigint-conversions';
import poseidon from 'circomlibjs/src/poseidon';
import {utils, Contract, BigNumber} from 'ethers';
import {ContractTransaction} from 'ethers/lib/ethers';
import {Result} from 'ethers/lib/utils';

import {formatTime} from '../lib/format';
import {isDetailedError, DetailedError} from '../types/error';
import {AdvancedStakeRewards, UTXOStatus} from '../types/staking';

import {
    getPoolContract,
    getSignableContract,
    getTokenContract,
    getZAssetsRegistryContract,
} from './contracts';
import {env} from './env';
import {parseTxErrorMessage} from './errors';
import {safeFetch} from './http';

// 452 (225 bytes) and 260 (128 bytes) are the sizes of the UTXO data containing
// 1 zZKP UTXO, and with and without 1 NFT UTXO, respectfully. First byte is
// reserved for the msg version number: 0x24 or 0x20 for the version with and
// without NFT. See documentation for more details:
// https://docs.google.com/document/d/11oY8TZRPORDP3p5emL09pYKIAQTadNhVPIyZDtMGV8k/
const ADVANCED_STAKE_UTXO_DATA_SIZES = [452, 260];
const ADVANCED_STAKE_MESSAGE_TYPE_WITH_NFT = '0x24';
const ADVANCED_STAKE_MESSAGE_TYPE_NO_NFT = '0x20';

export async function getExitTime(
    library: any,
    chainId: number,
): Promise<number> {
    const contract = getPoolContract(library, chainId);
    const exitTimeBN = await contract.exitTime();
    const exitTime = Number(exitTimeBN.toString());
    const formatted = formatTime(exitTime * 1000, {
        style: 'short',
    });
    console.debug(`early redemption allowed at ${exitTime} (${formatted})`);
    return exitTime;
}

export async function getExitDelay(
    library: any,
    chainId: number,
): Promise<number> {
    const contract = getPoolContract(library, chainId);
    const exitDelayBN = await contract.exitDelay();
    const exitDelay = Number(exitDelayBN.toString());
    console.debug(`Exit delay: ${exitDelay}`);
    return exitDelay;
}

export const getExitCommitment = (
    privSpendingKey: PrivateKey,
    recipient: string,
): string => {
    return utils.keccak256(
        utils.defaultAbiCoder.encode(
            ['uint256', 'address'],
            [privSpendingKey, recipient],
        ),
    );
};

export async function registerCommitToExit(
    library: any,
    account: string,
    chainId: number,
    utxoData: string,
    leafId: bigint,
    keys: IKeypair[],
): Promise<ContractTransaction | DetailedError> {
    const {contract} = getSignableContract(
        library,
        chainId,
        account,
        getPoolContract,
    );

    const [rootSpendingKeypair, rootReadingKeypair] = keys;
    const {
        status,
        error,
        cannotDecode,
        isChildKeyInvalid,
        childSpendingKeypair,
        nullifier,
    } = await unpackUTXOAndDeriveKeys(
        contract,
        rootSpendingKeypair,
        rootReadingKeypair.privateKey,
        leafId,
        utxoData,
    );
    const possibleError = checkUnpackingErrors(
        error,
        isChildKeyInvalid,
        cannotDecode,
        childSpendingKeypair,
    );
    if (isDetailedError(possibleError)) {
        return possibleError;
    }

    if (status === UTXOStatus.SPENT) {
        return {
            message: 'zAsset is already spent.',
            details: 'Spent nullifier: ' + nullifier,
        } as DetailedError;
    }

    const commitmentHash = getExitCommitment(
        childSpendingKeypair!.privateKey,
        account,
    );

    return await poolContractCommitToExit(contract, commitmentHash);
}

export async function poolContractCommitToExit(
    poolContract: Contract,
    commitmentHash: string,
): Promise<ContractTransaction | DetailedError> {
    let tx: any;

    try {
        tx = await poolContract.commitToExit(commitmentHash);
        return tx;
    } catch (err) {
        const parsedError = parseTxErrorMessage(err);
        if (parsedError === 'execution reverted: PP:E32') {
            // special case for "already registered commitment".
            // This could happen when the cache of the browser is cleared
            return tx;
        }
        return {
            message: 'Transaction error',
            details: parsedError,
            triggerError: err as Error,
        } as DetailedError;
    }
}

/*
exit decodes UTXO data received from the subgraph, deciphers the random secret,
generates child spending keys, checks if the  nullifier is not spent, verifies
that the commitment (leaf) of the Merkle tree is the same as the commitment of
the UTXO, generates and checks Merkle path, and finally submits exit()
transaction. Returns a UTXOStatus indicating whether the UTXO is spent or not.
*/
export async function exit(
    library: any,
    account: string,
    chainId: number,
    utxoData: string,
    leafId: bigint,
    creationTime: number,
    commitments: string[],
    keys: IKeypair[],
): Promise<[UTXOStatus, DetailedError | ContractTransaction]> {
    const {contract} = getSignableContract(
        library,
        chainId,
        account,
        getPoolContract,
    );

    const [rootSpendingKeypair, rootReadingKeypair] = keys;

    const {
        status,
        error,
        cannotDecode,
        isChildKeyInvalid,
        childSpendingKeypair,
        zAssetId,
        amounts,
        nullifier,
    } = await unpackUTXOAndDeriveKeys(
        contract,
        rootSpendingKeypair,
        rootReadingKeypair.privateKey,
        leafId,
        utxoData,
    );
    const possibleError = checkUnpackingErrors(
        error,
        isChildKeyInvalid,
        cannotDecode,
        childSpendingKeypair,
    );
    if (isDetailedError(possibleError)) {
        return [UTXOStatus.UNDEFINED, possibleError];
    }

    if (status === UTXOStatus.SPENT) {
        return [
            UTXOStatus.SPENT,
            {
                message: 'zAsset is already spent.',
                details: 'Spent nullifier: ' + nullifier,
            } as DetailedError,
        ];
    }

    const tokenContract = getTokenContract(library, chainId);
    const zAssetsRegistry = getZAssetsRegistryContract(library, chainId);
    const tokenId = BigInt(0);
    const zAssetBN = await zAssetsRegistry.getZAssetId(
        tokenContract.address,
        tokenId,
    );

    if (zAssetBN.toHexString() !== zAssetId) {
        return [
            UTXOStatus.UNDEFINED,
            {
                message: 'zAsset is not registered.',
                details: 'Expected: ' + bigintToBytes32 + ', got: ' + zAssetId,
            } as DetailedError,
        ];
    }

    const commitmentHex = bigintToBytes32(
        poseidon([
            bigintToBytes32(childSpendingKeypair!.publicKey[0]),
            bigintToBytes32(childSpendingKeypair!.publicKey[1]),
            bigintToBytes32(
                BigNumber.from(amounts)
                    .shl(192)
                    .or(BigNumber.from(zAssetId).shl(32))
                    .or(BigNumber.from(creationTime))
                    .toBigInt(),
            ),
        ]),
    );

    const zZkpCommitment = commitments[0];
    if (commitmentHex !== zZkpCommitment) {
        return [
            UTXOStatus.UNSPENT,
            {
                message: 'Invalid zAsset commitment.',
                details:
                    'Expected: ' + zZkpCommitment + ', got: ' + commitmentHex,
            } as DetailedError,
        ];
    }

    const path = await generateMerklePath(leafId, chainId);
    if (path instanceof Error) {
        return [
            UTXOStatus.UNSPENT,
            {
                message: 'Cannot generate Merkle proof of valid zAsset',
                details: path.message,
                triggerError: path,
            } as DetailedError,
        ];
    }
    const [pathElements, proofLeafHex, merkleTreeRoot] = path;

    if (proofLeafHex !== zZkpCommitment) {
        // This error also shoots when the tree is outdated

        return [
            UTXOStatus.UNSPENT,
            {
                message: "zAsset didn't match shielded pool entry.",
                details:
                    'Expected: ' + proofLeafHex + ', got: ' + zZkpCommitment,
            } as DetailedError,
        ];
    }

    const result = await poolContractExit(
        contract,
        tokenContract.address,
        tokenId as bigint,
        amounts as bigint,
        creationTime,
        childSpendingKeypair!.privateKey,
        leafId as bigint,
        pathElements,
        merkleTreeRoot,
        BigInt(0), // cacheIndexHint
    );
    if (isDetailedError(result)) {
        return [UTXOStatus.UNSPENT, result];
    }

    return [UTXOStatus.SPENT, result as ContractTransaction];
}

export type UTXOStatusByID = [string, UTXOStatus];

// getChangedUTXOsStatuses returns an array of UTXOStatusByID of the statuses
// that need updates
export async function getChangedUTXOsStatuses(
    library: any,
    account: string,
    chainId: number,
    advancedRewards: AdvancedStakeRewards[],
    keys: IKeypair[],
): Promise<UTXOStatusByID[]> {
    const {contract} = getSignableContract(
        library,
        chainId,
        account,
        getPoolContract,
    );

    const [rootSpendingKeypair, rootReadingKeypair] = keys;

    const statusesNeedUpdate: UTXOStatusByID[] = [];
    for await (const reward of advancedRewards) {
        if (reward.zZkpUTXOStatus === UTXOStatus.SPENT) {
            continue;
        }

        const {status} = await unpackUTXOAndDeriveKeys(
            contract,
            rootSpendingKeypair,
            rootReadingKeypair.privateKey,
            BigInt(reward.id),
            reward.utxoData,
        );

        if (status !== reward.zZkpUTXOStatus) {
            statusesNeedUpdate.push([reward.id, status]);
        }
    }

    return statusesNeedUpdate;
}

async function unpackUTXOAndDeriveKeys(
    contract: Contract,
    rootSpendingKeypair: IKeypair,
    rootReadingPrivateKey: PrivateKey,
    leafId: bigint,
    utxoData: string,
): Promise<{
    status: UTXOStatus;
    error?: Error;
    isChildKeyInvalid?: boolean;
    cannotDecode?: boolean;
    childSpendingKeypair?: IKeypair;
    ciphertextMsg?: string;
    zAssetId?: string;
    amounts?: bigint;
    nullifier?: string;
}> {
    const decoded = decodeUTXOData(utxoData);
    if (decoded instanceof Error) {
        return {
            status: UTXOStatus.UNDEFINED,
            error: decoded,
            cannotDecode: true,
        };
    }
    const [ciphertextMsg, zAssetId, amounts] = decoded;

    const randomSecret = decryptRandomSecret(
        ciphertextMsg,
        rootReadingPrivateKey,
    );
    if (!randomSecret) {
        return {
            status: UTXOStatus.UNDEFINED,
            error: new Error(`Failed to decrypt random secret ${randomSecret}`),
        };
    }
    const [childSpendingKeypair, isChildKeyValid] = deriveSpendingChildKeypair(
        rootSpendingKeypair,
        randomSecret,
    );
    if (!isChildKeyValid) {
        return {
            status: UTXOStatus.UNDEFINED,
            error: new Error('Invalid spending public key'),
            isChildKeyInvalid: !isChildKeyValid,
        };
    }

    const [isSpent, nullifier] = await isNullifierSpent(
        contract,
        childSpendingKeypair.privateKey,
        leafId,
    );

    const status = isSpent ? UTXOStatus.SPENT : UTXOStatus.UNSPENT;

    return {
        status,
        childSpendingKeypair,
        ciphertextMsg,
        zAssetId,
        amounts,
        nullifier,
    };
}

function decodeUTXOData(utxoData: string): [string, string, bigint] | Error {
    // 452 (225 bytes) and 260 (128) are the size of the UTXO data containing 1
    // zZKP UTXO, with and without NFT UTXO generated during advanced stake.
    // First byte is reserved for the msg version number. Next 96 bytes after
    // the Message type are: 64 bytes are packed message with UTXO secrets, 32
    // bytes for the zAssetsID. Last 128 bytes are the bytes with the NFT data
    // (ignored for now). See documentation for more details:
    // https://docs.google.com/document/d/11oY8TZRPORDP3p5emL09pYKIAQTadNhVPIyZDtMGV8k/
    if (!ADVANCED_STAKE_UTXO_DATA_SIZES.includes(utxoData.length)) {
        console.log('utxoData.length', utxoData.length);
        const msg = 'Invalid UTXO data length';
        console.error(msg);
        return new Error(msg);
    }

    let decoded: Result;
    if (utxoData.slice(0, 4) == ADVANCED_STAKE_MESSAGE_TYPE_WITH_NFT) {
        decoded = decodeWithNFT(utxoData);
    } else if (utxoData.slice(0, 4) == ADVANCED_STAKE_MESSAGE_TYPE_NO_NFT) {
        decoded = decodeDataWithoutNFT(utxoData);
    } else {
        const msg = 'Invalid UTXO data or message type';
        console.error(msg);
        return new Error(msg);
    }

    const secrets = decoded[0];
    const ciphertextMsg = secrets
        .map(bytesToHexString32)
        .map((v: string) => v.slice(2))
        .join('');

    const zAssetIdAndAmount = BigNumber.from(decoded[1]);
    const zAssetId = bigintToBytes(zAssetIdAndAmount.shr(96).toBigInt(), 20);
    const amount = zAssetIdAndAmount
        .and(BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFF'))
        .toBigInt();

    console.debug(
        `decoding UTXO data: zAssetId=${zAssetId}, amount=${amount}}`,
    );

    return [ciphertextMsg, zAssetId, amount];
}

function decodeDataWithoutNFT(utxoData: string) {
    return utils.defaultAbiCoder.decode(
        ['uint256[2]', 'uint256'],
        '0x' + utxoData.slice(4, utxoData.length),
    );
}

function decodeWithNFT(utxoData: string) {
    return utils.defaultAbiCoder.decode(
        ['uint256[2]', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
        '0x' + utxoData.slice(4, utxoData.length),
    );
}

function checkUnpackingErrors(
    error?: Error,
    isChildKeyInvalid?: boolean,
    cannotDecode?: boolean,
    childSpendingKeypair?: IKeypair,
): DetailedError | null {
    if (cannotDecode && error) {
        return {
            message: 'Redemption error',
            details: `Cannot decode zAsset secret message: ${error.message}`,
            triggerError: error,
        } as DetailedError;
    }

    if (isChildKeyInvalid || !childSpendingKeypair) {
        const msg = error?.message;

        return {
            message: `Cannot derive the key to spend zAsset. ${
                msg ? `: ${msg}` : ''
            }`,

            details: msg ? `: ${msg}` : '',
        } as DetailedError;
    }

    return null;
}

export async function isNullifierSpent(
    poolContract: Contract,
    privateSpendingKey: PrivateKey,
    leafId: bigint,
): Promise<[boolean, string]> {
    console.time('isNullifierSpent()');
    const nullifier = bigintToBytes32(
        poseidon([
            bigintToBytes32(privateSpendingKey),
            bigintToBytes32(leafId),
        ]),
    );
    const isSpent = await poolContract.isSpent(nullifier);
    console.timeEnd('isNullifierSpent()');
    return [isSpent, nullifier];
}

async function generateMerklePath(
    leafId: bigint,
    chainId: number,
): Promise<[string[], string, string, number] | Error> {
    const treeUri = env[`COMMITMENT_TREE_URL_${chainId}`];

    const treeResponse = await safeFetch(treeUri as string);
    if (treeResponse instanceof Error) {
        return treeResponse;
    }

    try {
        const treeJson = await treeResponse.json();
        const tree = TriadMerkleTree.deserialize(treeJson);
        const [merkleProof, treeId] = generateMerkleProof(leafId, tree);
        const pathElements =
            triadTreeMerkleProofToPathElements(merkleProof).map(
                bigintToBytes32,
            );

        return [
            pathElements,
            bigintToBytes32(merkleProof.leaf),
            bigintToBytes32(merkleProof.root),
            treeId,
        ];
    } catch (error) {
        return error as Error;
    }
}

async function poolContractExit(
    poolContract: Contract,
    tokenAddress: string,
    tokenId: bigint,
    amount: bigint,
    creationTime: number,
    privSpendingKey: bigint,
    leafId: bigint,
    pathElements: string[], // bytes32[16]
    merkleRoot: string,
    cacheIndexHint: bigint,
): Promise<ContractTransaction | DetailedError> {
    let tx: any;

    try {
        tx = await poolContract.exit(
            tokenAddress,
            tokenId,
            amount,
            creationTime,
            privSpendingKey,
            leafId,
            pathElements,
            merkleRoot,
            cacheIndexHint,
        );
        return tx;
    } catch (err) {
        return {
            message: 'Transaction error',
            details: parseTxErrorMessage(err),
            triggerError: err as Error,
        } as DetailedError;
    }
}
