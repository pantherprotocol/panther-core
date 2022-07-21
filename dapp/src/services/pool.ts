import {
    toBytes32,
    bigintToBytes32,
    bigintToBytes,
} from '@panther-core/crypto/lib/bigint-conversions';
import {
    generateMerkleProof,
    TriadMerkleTree,
    triadTreeMerkleProofToPathElements,
} from '@panther-core/crypto/lib/triad-merkle-tree';
import poseidon from 'circomlibjs/src/poseidon';
import {utils, Contract, BigNumber} from 'ethers';
import {AdvancedStakeRewards, UTXOStatus} from 'staking';

import {CONFIRMATIONS_NUM} from '../lib/constants';
import {parseTxErrorMessage} from '../lib/errors';
import {getEventFromReceipt} from '../lib/events';
import {formatTime} from '../lib/format';
import {IKeypair, PrivateKey} from '../lib/types';

import {
    getPoolContract,
    getSignableContract,
    getZAssetsRegistryContract,
} from './contracts';
import {env} from './env';
import {notifyError} from './errors';
import {safeFetch} from './http';
import {deriveSpendingChildKeypair} from './keychain';
import {decryptRandomSecret as decryptRandomSecret} from './message-encryption';
import {openNotification, removeNotification} from './notification';

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
): Promise<UTXOStatus> {
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
        tokenAddress,
        amounts,
        tokenId,
        nullifier,
    } = await unpackUTXOAndDeriveKeys(
        contract,
        rootSpendingKeypair,
        rootReadingKeypair.privateKey,
        leafId,
        utxoData,
    );
    if (cannotDecode && error) {
        notifyError(
            'Redemption error',
            `Cannot decode zAsset secret message: ${error.message}`,
            error,
        );
        return UTXOStatus.UNDEFINED;
    }

    if (isChildKeyInvalid || !childSpendingKeypair) {
        const msg = error?.message;
        notifyError(
            'Redemption error',
            `Cannot derive the key to spend zAsset${msg ? `: ${msg}` : ''}`,
            {
                childSpendingPubKey: childSpendingKeypair
                    ? childSpendingKeypair.publicKey
                    : 'undefined',
                rootSpendingPubKey: rootSpendingKeypair.publicKey,
            },
        );
        return UTXOStatus.UNDEFINED;
    }

    if (status === UTXOStatus.SPENT) {
        notifyError('Redemption error', 'zAsset is already spent.', {
            nullifier,
        });
        return UTXOStatus.SPENT;
    }

    const zAssetsRegistry = getZAssetsRegistryContract(library, chainId);
    const zAssetId = await zAssetsRegistry.getZAssetId(tokenAddress, tokenId);
    const commitmentHex = bigintToBytes32(
        poseidon([
            bigintToBytes32(childSpendingKeypair.publicKey[0]),
            bigintToBytes32(childSpendingKeypair.publicKey[1]),
            bigintToBytes32(amounts as bigint),
            zAssetId,
            bigintToBytes32(BigInt(creationTime)),
        ]),
    );

    const zZkpCommitment = commitments[0];
    if (commitmentHex !== zZkpCommitment) {
        notifyError('Redemption error', 'Invalid zAsset commitment.', {
            commitmentInProof: commitmentHex,
            commitmentInEvent: zZkpCommitment,
        });
        return UTXOStatus.UNSPENT;
    }

    const path = await generateMerklePath(leafId, chainId);
    if (path instanceof Error) {
        notifyError(
            'Redemption error',
            `Cannot generate Merkle proof of valid zAsset: ${path.message}`,
            path,
        );
        return UTXOStatus.UNSPENT;
    }
    const [pathElements, proofLeafHex, merkleTreeRoot, treeIndex] = path;

    if (proofLeafHex !== zZkpCommitment) {
        // This error also shoots when the tree is outdated
        notifyError(
            'Redemption error',
            "zAsset didn't match shielded pool entry.",
            {
                leafInProof: proofLeafHex,
                leafInEvent: zZkpCommitment,
            },
        );
        return UTXOStatus.UNSPENT;
    }

    const isProofValid = await poolContractVerifyMerkleProof(
        contract,
        Number(leafId),
        merkleTreeRoot,
        treeIndex,
        proofLeafHex,
        pathElements,
    );
    if (isProofValid instanceof Error) {
        notifyError(
            'Redemption error',
            'Merkle proof of zAsset in shielded pool is not correct.',
            {
                proofLeaf: proofLeafHex,
                leafId: bigintToBytes32(leafId),
                merkleTreeRoot,
                pathElements,
            },
        );
        return UTXOStatus.UNSPENT;
    }

    const result = await poolContractExit(
        contract,
        tokenAddress!,
        tokenId as bigint,
        amounts as bigint,
        Number(creationTime),
        childSpendingKeypair.privateKey,
        leafId as bigint,
        pathElements,
        merkleTreeRoot,
        BigInt(0), // cacheIndexHint
    );
    if (result instanceof Error) {
        return UTXOStatus.UNSPENT;
    }

    return UTXOStatus.SPENT;
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
    tokenAddress?: string;
    amounts?: bigint;
    tokenId?: bigint;
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
    const [ciphertextMsg, tokenAddress, amounts, tokenId] = decoded;

    const randomSecret = decryptRandomSecret(
        ciphertextMsg,
        rootReadingPrivateKey,
    );

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
        tokenAddress,
        amounts,
        tokenId,
        nullifier,
    };
}

function decodeUTXOData(
    utxoData: string,
): [string, string, bigint, bigint] | Error {
    // 648 is the size of the UTXO data containing 2 UTXO commitments
    // first byte is reserved for the msg version number.
    // next 92 bytes after the Message type is packed message with UTXO
    // secrets, 32 bytes for the token address, and the last 32 bytes for the
    // token id. See documentation for more details:
    // https://docs.google.com/document/d/11oY8TZRPORDP3p5emL09pYKIAQTadNhVPIyZDtMGV8k/
    if (utxoData.length !== 648) {
        return new Error('Invalid zAssets data length');
    }

    if (utxoData.slice(0, 4) !== '0xab') {
        return new Error('Invalid zAssets data or message type');
    }
    const decoded = utils.defaultAbiCoder.decode(
        ['uint256[3]', 'uint256', 'uint256'],
        '0x' + utxoData.slice(4, utxoData.length),
    );
    const secrets = decoded[0];
    const ciphertextMsg = secrets
        .map(toBytes32)
        .map((v: string) => v.slice(2))
        .join('');

    const tokenAndAmount = BigNumber.from(decoded[1]);
    const tokenAddress = bigintToBytes(tokenAndAmount.shr(96).toBigInt(), 20);
    const amount = tokenAndAmount
        .and(BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFF'))
        .toBigInt();
    const tokenId = decoded[2];

    console.debug(
        `ciphertextMsg=${ciphertextMsg}, tokenAddress=${tokenAddress}, amount=${amount}, tokenId=${tokenId}`,
    );
    return [ciphertextMsg, tokenAddress, amount, tokenId];
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
): Promise<undefined | Error> {
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
    } catch (err) {
        return notifyError('Transaction error', parseTxErrorMessage(err), {
            err,
            tx,
        });
    }

    const inProgress = openNotification(
        'Transaction in progress',
        'Your withdrawal transaction is currently in progress. Please wait for confirmation!',
        'info',
    );

    const receipt = await tx.wait(CONFIRMATIONS_NUM);
    removeNotification(inProgress);

    const event = await getEventFromReceipt(receipt, 'Nullifier');
    if (event instanceof Error) {
        return notifyError(
            'Transaction error',
            `Cannot find event in receipt: ${parseTxErrorMessage(event)}`,
            event,
        );
    }

    openNotification(
        'Withdrawal completed successfully',
        'Congratulations! Your withdrawal transaction was processed!',
        'info',
        10000,
    );
}

async function poolContractVerifyMerkleProof(
    contract: Contract,
    leafId: number,
    rootHex: string,
    treeIndex: number,
    commitment: string,
    pathElements: string[],
): Promise<boolean | Error> {
    try {
        const quadNodeIndex = Math.floor(leafId / 4);
        await contract.verifyMerkleProof(
            rootHex,
            treeIndex,
            quadNodeIndex,
            commitment,
            pathElements,
        );

        return true;
    } catch (error) {
        return error as Error;
    }
}
