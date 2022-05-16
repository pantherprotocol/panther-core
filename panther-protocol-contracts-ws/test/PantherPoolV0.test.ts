// SPDX-License-Identifier: MIT
import { expect } from 'chai';

// @ts-ignore
import {
    toBytes32, PathElementsType, toBigNum, Triad, PathElementsTypeSend, Pair, Triad3of2, Triad3of3, Pair2of2, Quad
} from '../lib/utilities';
import { takeSnapshot, revertSnapshot } from './helpers/hardhat';
import { MockMerkleProofVerifier, MockPantherPoolV0, MockTriadIncrementalMerkleTrees } from '../types';
import { deployMockTrees } from './helpers/mockTriadTrees';
import { poseidon, babyjub } from 'circomlibjs';
import {TriadMerkleTree} from '../lib/tree';
import assert from 'assert';
import { BytesLike } from 'ethers/lib/ethers';
import {generateRandomBabyJubValue,multiplyScalars} from '../lib/keychain';
import { encryptMessage, generateEcdhSharedKey } from '../lib/message-encryption';
import crypto from 'crypto';
import { BigNumber, ethers, utils } from 'ethers';
import { bigintToBytes32 } from '../lib/conversions';
import { text } from 'stream/consumers';
import { deployMockMerkleProofVerifier } from './helpers/mockMerkleProofVerifier';

import '../lib/keychain';
import { deployMockPantherPoolV0 } from './helpers/mockPantherPoolV0';
import { defaultAbiCoder, keccak256 } from 'ethers/lib/utils';
import exp = require('constants');

describe('PantherPoolV0', () => {
    let poolV0: MockPantherPoolV0;
    let snapshot: number;

    before(async () => {
        poolV0 = await deployMockPantherPoolV0();
    });

    describe('TEST', () => {
        before(async () => {
            snapshot = await takeSnapshot();
        });

        after(async () => {
            await revertSnapshot(snapshot);
        });

        const poseidon2or3 = (inputs: bigint[]): bigint => {
            assert(inputs.length === 3 || inputs.length === 2);
            return poseidon(inputs);
        };

        // TODO: This flow must be re-factored to functions
        // 1) - All related to crytography must be double checked in code: all `expects` must hold in production code,
        //      and if not, re-try procedure must be taken, for example:
        // Create Keys and encrypts message and pack to be send on-chain -> try to extract & decrypt & recreate-commitments
        // If it fails re-try procedure will be re-creation of all created-keys
        // In production new-key can't be used without this double-test
        describe('Flow of key-generation, commitments creation, generate-deposits + exit && double checks on every-step', function () {
            function bnToBuf(bn) {
                // The handy-dandy `toString(base)` works!!
                var hex = BigInt(bn).toString(16);

                // But it still follows the old behavior of giving
                // invalid hex strings (due to missing padding),
                // but we can easily add that back
                if (hex.length % 2) { hex = '0' + hex; }

                // The byteLength will be half of the hex string length
                var len = hex.length / 2;
                var u8 = new Uint8Array(32); //len);

                // And then we can iterate each element by one
                // and each hex segment by two
                var i = 0;
                var j = 0;
                while (i < len) {
                    u8[i] = parseInt(hex.slice(j, j+2), 16);
                    i += 1;
                    j += 2;
                }
                // zeros - since we want 32 bytes
                while ( i < 32 ) {
                    u8[i] = parseInt(BigInt(0).toString(16).slice(0, 2), 16);
                    i += 1;
                }
                // Tada!!
                return u8;
            }

            function bufToBn(buf) {
                var hex : string[] = [];
                var u8 = Uint8Array.from(buf);

                u8.forEach(function (i) {
                    var h = i.toString(16);
                    if (h.length % 2) { h = '0' + h; }
                    hex.push(h);
                });

                return BigInt('0x' + hex.join(''));
            }

            // [0] - Recipient side
            const s = generateRandomBabyJubValue(); // Spender Private Key
            const S = babyjub.mulPointEscalar(babyjub.Base8, s); // Spender Public Key - Shared & known to sender
            // [1] - Sender side
            const r = generateRandomBabyJubValue(); // Sender generates random value
            // This key used to create commitments with `generateDeposits` solidity call
            const K = babyjub.mulPointEscalar(S,r); // Sender generates Shared Ephemeral Key = rsB = rS
            const R = babyjub.mulPointEscalar(babyjub.Base8, r); // This key is shared in open form = rB
            // [2] - Encrypt text - Version-1: Prolog,Random = 4bytes, 32bytes ( decrypt in place just for test )
            const prolog = 0xEEFFEEFF; // THIS prolog must be used as is, according to specs
            const textToBeCiphered = new Uint8Array( [...bnToBuf(prolog).slice(0,4), ...(bnToBuf(r))]);
            expect(textToBeCiphered.length, "cipher text before encryption").equal(36);
            // ***********************************************
            // This is encryption function *******************
            // ***********************************************
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(
                'aes-256-cbc',
                utils.arrayify(bigintToBytes32(K[0])), // Are we sure its only X , and no Y is used here
                iv
                //Buffer.from(iv)
            );

            const cipheredText1 = cipher.update(textToBeCiphered);
            const cipheredText2 = cipher.final();
            // RESULTED text to send on-chain in its ciphered form
            const cipheredText = new Uint8Array([...cipheredText1,...cipheredText2]);
            expect(cipheredText.length,"ciphered text after encryption").equal(48);
            // *************************************************
            // ***********************************************
            // ***********************************************

            // ***********************************************
            // This is decryption function *******************
            // ***********************************************
            const Ktag = babyjub.mulPointEscalar(R,s); // Sender generates Shared Ephemeral Key = rsB = rS
            const decipher = crypto.createDecipheriv(
                'aes-256-cbc',
                utils.arrayify(bigintToBytes32(Ktag[0])),
                iv
                //Buffer.from(iv),
            );

            const decrypted1 = decipher.update(cipheredText);
            const decrypted2 = decipher.final();
            // RESULT that will be used by recipient in order to spend funds
            const decrypted = new Uint8Array([...decrypted1,...decrypted2]);
            // console.log("decrypted-text:", decrypted, ", length: ", decrypted.length);
            expect(decrypted.length).equal(textToBeCiphered.length);
            expect(decrypted.length).equal(36);
            expect(decrypted.slice(0,0+4), "prolog ciphered -> deciphered must be equal").to.deep.equal(textToBeCiphered.slice(0,0+4));
            expect(decrypted.slice(4,4+32), "random ciphered -> deciphered must be equal").to.deep.equal(textToBeCiphered.slice(4,4+32));
            // *************************************************
            // ***********************************************
            // ***********************************************

            // [3] - Pack ciphertextMsg: IV, Ephemeral, Encrypted-Message-V1
            const R_packed = babyjub.packPoint(R);
            const cipherTextMessageV1 = new Uint8Array([...iv, ...R_packed, ...cipheredText]);
            expect(cipherTextMessageV1.length).equal(96);
            // [3.1] - Lets try to unpack & decrypt --- NOTE: this test must be executed each time sender creates new commitments
            // Unpack
            const IV_from_chain = cipherTextMessageV1.slice(0,0+16);
            const R_packed_from_chain = cipherTextMessageV1.slice(16,16+32);
            const cipheredText_from_chain = cipherTextMessageV1.slice(48,48+48);
            // Decrypt
            const R_unpacked = babyjub.unpackPoint(R_packed_from_chain);

            const K_from_chain = babyjub.mulPointEscalar(R_unpacked,s); // Sender generates Shared Ephemeral Key = rsB = rS
            const decipher_from_chain = crypto.createDecipheriv(
                'aes-256-cbc',
                utils.arrayify(bigintToBytes32(K_from_chain[0])),
                IV_from_chain,
                //Buffer.from(iv),
            );

            const decrypted1_from_chain = decipher_from_chain.update(cipheredText_from_chain);
            const decrypted2_from_chain = decipher_from_chain.final();
            // RESULT that will be used by recipient in order to spend funds
            const decrypted_from_chain = new Uint8Array([...decrypted1_from_chain,...decrypted2_from_chain]);
            expect(decrypted_from_chain.length).equal(36);
            const prolog_from_chain = decrypted_from_chain.slice(0,0+4);
            expect(prolog_from_chain,"extracted from chain prolog must be equal").to.deep.equal(bnToBuf(prolog).slice(0,4));
            const r_from_chain = decrypted_from_chain.slice(4,4+32);
            // TODO: something here sometimes not plays correctly - it must be wrapped inside "if" and if not log everything & re-try recreating all keys.
            expect(bufToBn(r_from_chain),"extracted from chain random must be equal").equal(r);
            // [4] - TODO: call generateDeposits - with R & cipherTextMessageV1 for each OUT_UTXOs = 3
            const Token = BigInt(111);
            const tokens = [
                toBytes32(Token.toString()),
                toBytes32(Token.toString()),
                toBytes32(Token.toString()),
            ] as Triad;
            const Amounts = [BigInt(7),BigInt(8),BigInt(9)];
            const amounts = [
                toBytes32(Amounts[0].toString()),
                toBytes32(Amounts[1].toString()),
                toBytes32(Amounts[2].toString()),
            ] as Triad;

            const spendingPublicKey = [toBytes32(K[0].toString()), toBytes32(K[1].toString())] as Pair;
            const secrets = [
                toBytes32(bufToBn(cipherTextMessageV1.slice(0, 32)).toString()),
                toBytes32(bufToBn(cipherTextMessageV1.slice(32, 64)).toString()),
                toBytes32(bufToBn(cipherTextMessageV1.slice(64, 96)).toString()),
            ] as Triad;

            const createdAtNum = BigInt('1652375774');
            const createdAt = toBytes32(createdAtNum.toString());
            const leftLeafID = 0;
            let zAsset_from_chain = BigNumber.from(0);

            it('GenerateDeposits and try to Exit', async () => {
                // This is real token number that will be used inside circom
                const zAssetIdSol = await poolV0.GetZAssetId(Token, BigInt(0));
                zAsset_from_chain = zAssetIdSol;
                expect(zAssetIdSol,"Check zAsset equality BigNumber vs BigInt").equal(zAsset_from_chain);
                // const zAssetIdTs = keccak256(defaultAbiCoder.encode(["uint256","uint256"],[Token,BigInt(0)]));
                // const zAssetIdTs = defaultAbiCoder.encode(["uint160"],[keccak256(defaultAbiCoder.encode(["uint256","uint256"],[BigInt(111),BigInt(0)]))]);
                // TODO: cast zAssetIdTs to uint160
                // const z = toBigNum(zAssetIdTs);
                // const z1 = Number(z) >> 96;
                // expect(zAssetIdSol, "Solidity token is equal to typescript token").equal( z1 );
                // TODO: uze zAssetIdTs to generate commitment inside TS

                let CommitmentsFromSolidity = [BigNumber.from(0),BigNumber.from(0),BigNumber.from(0)];
                let CommitmentsInternal = [BigNumber.from(0),BigNumber.from(0),BigNumber.from(0)];

                //const zAssetIdSol = await poolV0.GetZAssetId(Token, BigInt(0));
                //zAsset_from_chain = zAssetIdSol;
                const commitment1 = await poolV0.GenerateCommitments(K[0],K[1],Amounts[0],zAsset_from_chain,createdAtNum);
                const commitment1_internal = poseidon([K[0],K[1],Amounts[0],zAsset_from_chain,createdAtNum]);
                expect(commitment1, "Solidity commitment-1 must be equal to TS commitment").equal(commitment1_internal);
                CommitmentsFromSolidity[0] = commitment1;
                CommitmentsInternal[0] = commitment1;

                const commitment2 = await poolV0.GenerateCommitments(K[0], K[1], Amounts[1], zAsset_from_chain, createdAtNum);
                const commitment2_internal = poseidon([K[0], K[1], Amounts[1], zAsset_from_chain, createdAtNum]);
                expect(commitment2, "Solidity commitment-2 must be equal to TS commitment").equal(commitment2_internal);
                CommitmentsFromSolidity[1] = commitment2;
                CommitmentsInternal[1] = commitment1;

                const commitment3 = await poolV0.GenerateCommitments(K[0], K[1], Amounts[2], zAsset_from_chain, createdAtNum);
                const commitment3_internal = poseidon([K[0], K[1], Amounts[2], zAsset_from_chain, createdAtNum]);
                expect(commitment3, "Solidity commitment-3 must be equal to TS commitment").equal(commitment3_internal);
                CommitmentsFromSolidity[2] = commitment3;
                CommitmentsInternal[1] = commitment1;

                // [5] - Get event secretMsg = cipherTextMessageV1 = 3x256bit, token = 160bit, amount = 32bit = 4x256bit
                //const zAssetIdSol = await poolV0.GetZAssetId(Token, BigInt(0));
                const zAssetIdBuf1 = bnToBuf(zAssetIdSol);
                const amountBuf1 = bnToBuf(Amounts[0]);
                const merged1 = new Uint8Array([...zAssetIdBuf1.slice(0, 20), ...amountBuf1.slice(0, 12).reverse()]);
                const secrets_from_chain1 = [
                    {
                        "_hex": toBytes32(bufToBn(cipherTextMessageV1.slice(0, 32)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(bufToBn(cipherTextMessageV1.slice(32, 64)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(bufToBn(cipherTextMessageV1.slice(64, 96)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(bufToBn(merged1).toString()),
                        "_isBigNumber": true
                    },
                ];

                const zAssetIdBuf2 = bnToBuf(zAssetIdSol);
                const amountBuf2 = bnToBuf(Amounts[1]);
                const merged2 = new Uint8Array([...zAssetIdBuf2.slice(0, 20), ...amountBuf2.slice(0, 12)]);
                const secrets_from_chain2 = [
                    {
                        "_hex": toBytes32(bufToBn(cipherTextMessageV1.slice(0, 32)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(bufToBn(cipherTextMessageV1.slice(32, 64)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(bufToBn(cipherTextMessageV1.slice(64, 96)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(bufToBn(merged2).toString()),
                        "_isBigNumber": true
                    },
                ];

                const zAssetIdBuf3 = bnToBuf(zAssetIdSol);
                const amountBuf3 = bnToBuf(Amounts[2]);
                const merged3 = new Uint8Array([...zAssetIdBuf3.slice(0, 20), ...amountBuf3.slice(0, 12)]);
                const secrets_from_chain3 = [
                    {
                        "_hex": toBytes32(bufToBn(cipherTextMessageV1.slice(0, 32)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(bufToBn(cipherTextMessageV1.slice(32, 64)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(bufToBn(cipherTextMessageV1.slice(64, 96)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(bufToBn(merged3).toString()),
                        "_isBigNumber": true
                    },
                ];

                console.log("B==========================================");
                // TODO: Add call to GenerateDepositsExtended with check of events parameters, see example ---
                // 0 - leafId, 1 - creationTime, 2 - commitments[3], 3 - secrets[4][3]
                await poolV0.GenerateDepositsExtended(tokens, amounts, spendingPublicKey, secrets, createdAt);
                /* Pay attention something inside [secrets] type not working - values are OK, but wrapping-type is not what is expected
                await expect(await poolV0.GenerateDepositsExtended(tokens, amounts, spendingPublicKey, secrets, createdAt)).to.emit(poolV0, 'NewCommitments').withArgs(
                    leftLeafID,
                    createdAtNum,
                    CommitmentsFromSolidity,
                    //[
                        //commitment1,
                        //commitment2,
                        //commitment3
                    //],
                    [
                        secrets_from_chain1,
                        secrets_from_chain2,
                        secrets_from_chain3
                    ]
                );
                */

                // [6] - TODO: unpack them
                // Since we checked equality when we got emitted event we will just use what we already have
                // [7] - TODO: from events extract R_packed -> unpack to R
                // Since we checked equality when we got emitted event we will just use what we already have
                // [8] - TODO: try to decrypt cipher-msg & test for `prolog` prefix if it there this message is for uu - Measure time of this step please
                // Since we checked equality when we got emitted event we will just use what we already have
                // [9] - TODO: extract 'r' & you are ready to execute `exit`
                // Since we checked equality when we got emitted event we will just use what we already have
                // [10]- Execute `exit` function to see if you can use locked funds
                // Prepare tree to get merkle proof
                let tree: TriadMerkleTree;
                const PANTHER_CORE_ZERO_VALUE = BigInt('2896678800030780677881716886212119387589061708732637213728415628433288554509');
                const PANTHER_CORE_TREE_DEPTH_SIZE = 15;
                tree = new TriadMerkleTree(PANTHER_CORE_TREE_DEPTH_SIZE, PANTHER_CORE_ZERO_VALUE, poseidon2or3);

                //const zAssetIdSol = await poolV0.GetZAssetId(Token, BigInt(0));
                const amountsOut = [BigInt('7'), BigInt('8'), BigInt('9')];
                // NOTE: use here zAssetId and not Token since this is what actually inserted into poseidon
                // same must be done inside circom
                const token = zAssetIdSol;
                const createTime = createdAtNum;
                // TODO: re-generate K by using data sended on-chain
                const pubKey: BigInt[] = [
                    K[0],
                    K[1]
                ];
                const commitments = [
                    poseidon([pubKey[0], pubKey[1], amountsOut[0], token, createTime]),
                    poseidon([pubKey[0], pubKey[1], amountsOut[1], token, createTime]),
                    poseidon([pubKey[0], pubKey[1], amountsOut[2], token, createTime])
                ];
                // console.log("3 leaves - Commitments:", commitments);
                // Insert to MT in order to get pathes to be used @ exit
                tree.insertBatch([BigInt(commitments[0]), BigInt(commitments[1]), BigInt(commitments[2])]);

                let merkleProof = [
                    tree.genMerklePath(0),
                    tree.genMerklePath(1),
                    tree.genMerklePath(2)
                ];

                // This private key must be used inside `exit` function
                const sr = multiplyScalars(s, r); // spender derived private key

                // This public key must be used in panther-core V1
                const SpenderDerivedPubKey = babyjub.mulPointEscalar(babyjub.Base8, sr); // S = sB S' = srB
                const pathElements = [
                    <BytesLike>toBytes32(merkleProof[0].pathElements[0][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[0][1].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[1][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[2][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[3][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[4][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[5][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[6][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[7][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[8][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[9][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[10][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[11][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[12][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[13][0].toString()),
                    <BytesLike>toBytes32(merkleProof[0].pathElements[14][0].toString()),
                ] as PathElementsType;
                const lId = 0;
                const tId = 0;
                const cacheIndexHint = 0; // don't use cache
                const checkRoot = await poolV0.isKnownRoot(0,toBytes32(BigInt(merkleProof[0].root).toString()),0);
                expect(checkRoot, "isKnownRoot must be true").equal(true);
                const checkZAsset = await poolV0.IsKnownZAsset(Token,tId);
                expect(checkZAsset, "IsKnownZAsset must be true").equal(true);
                await poolV0.Exit(
                    Token,
                    tId,
                    amountsOut[0],
                    createTime,
                    sr,
                    lId,
                    pathElements,
                    toBytes32(BigInt(merkleProof[0].root).toString()),
                    cacheIndexHint
                );
            });
        });
    });
});
