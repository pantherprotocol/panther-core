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
import {UTXOStatus} from 'staking';

import {CONFIRMATIONS_NUM} from '../lib/constants';
import {parseTxErrorMessage} from '../lib/errors';
import {getEventFromReceipt} from '../lib/events';
import {PrivateKey} from '../lib/types';

import {getPoolContract, getSignableContract} from './contracts';
import {env} from './env';
import {notifyError} from './errors';
import {deriveSpendingChildKeypair, deriveRootKeypairs} from './keychain';
import {decryptRandomSecret as decryptRandomSecret} from './message-encryption';
import {openNotification, removeNotification} from './notification';

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
): Promise<UTXOStatus> {
    const decoded = decodeUTXOData(utxoData);
    if (decoded instanceof Error) {
        notifyError(
            'Redemption error',
            `Cannot decode utxoData. ${parseTxErrorMessage(decoded)}`,
            decoded,
        );
        return UTXOStatus.UNDEFINED;
    }
    const [ciphertextMsg, tokenAddress, amounts, tokenId] = decoded;

    const {contract} = getSignableContract(
        library,
        chainId,
        account,
        getPoolContract,
    );

    const signer = library.getSigner(account);
    const [rootSpendingKeypair, rootReadingKeypair] = await deriveRootKeypairs(
        signer,
    );

    const randomSecret = decryptRandomSecret(
        ciphertextMsg,
        rootReadingKeypair.privateKey,
    );

    const [childSpendingKeypair, isValid] = deriveSpendingChildKeypair(
        rootSpendingKeypair,
        randomSecret,
    );
    if (!isValid) {
        notifyError('Redemption error', 'Invalid child spending public key', {
            childSpendingPubKey: childSpendingKeypair.publicKey,
            rootSpendingPubKey: rootSpendingKeypair.publicKey,
        });
        return UTXOStatus.UNDEFINED;
    }

    const [isSpent, nullifier] = await isNullifierSpent(
        contract,
        childSpendingKeypair.privateKey,
        leafId,
    );
    if (isSpent) {
        notifyError('Redemption error', 'zAsset is already spent', {
            nullifier,
        });
        return UTXOStatus.SPENT;
    }

    const zAssetId = await contract.getZAssetId(tokenAddress, tokenId);
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
        notifyError('Redemption error', 'Invalid commitment', {
            commitmentInProof: commitmentHex,
            commitmentInEvent: zZkpCommitment,
        });
        return UTXOStatus.UNSPENT;
    }

    const path = await generateMerklePath(leafId, chainId);
    if (path instanceof Error) {
        notifyError('Redemption error', 'Cannot generate Merkle path', path);
        return UTXOStatus.UNSPENT;
    }
    const [pathElements, proofLeafHex, merkleTreeRoot, treeIndex] = path;

    if (proofLeafHex !== zZkpCommitment) {
        notifyError('Redemption error', 'Invalid commitment', {
            leafInProof: proofLeafHex,
            leafInEvent: zZkpCommitment,
        });
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
        notifyError('Redemption error', 'Merkle path is not correct', {
            proofLeaf: proofLeafHex,
            leafId: bigintToBytes32(leafId),
            merkleTreeRoot,
            pathElements,
        });
        return UTXOStatus.UNSPENT;
    }

    const result = await poolContractExit(
        contract,
        tokenAddress,
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

async function generateMerklePath(
    leafId: bigint,
    chainId: number,
): Promise<[string[], string, string, number] | Error> {
    const treeUri = env[`COMMITMENT_TREE_URL_${chainId}`];

    let treeJson;
    try {
        treeJson = await fetch(treeUri as string).then(response =>
            response.json(),
        );
    } catch (error) {
        return error as Error;
    }

    const tree = TriadMerkleTree.deserialize(treeJson);
    const [merkleProof, treeId] = generateMerkleProof(leafId, tree);
    const pathElements =
        triadTreeMerkleProofToPathElements(merkleProof).map(bigintToBytes32);

    return [
        pathElements,
        bigintToBytes32(merkleProof.leaf),
        bigintToBytes32(merkleProof.root),
        treeId,
    ];
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
        return new Error('Invalid utxoData length');
    }

    if (utxoData.slice(0, 4) !== '0xab') {
        return new Error('Invalid utxoData or MessageType');
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
            `Cannot find event in receipt. ${parseTxErrorMessage(event)}`,
            event,
        );
    }

    openNotification(
        'Withdrawal completed successfully',
        'Congratulations! Your withdrawal transaction was processed!',
        'info',
        15000,
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
