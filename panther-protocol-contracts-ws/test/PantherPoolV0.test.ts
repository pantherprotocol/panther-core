// SPDX-License-Identifier: MIT
import { expect } from 'chai';

// @ts-ignore
import {
    toBytes32, PathElementsType, toBigNum, Triad, PathElementsTypeSend, Pair, Triad3of2,Triad3of3, Pair2of2
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
import { ethers, utils } from 'ethers';
import { bigintToBytes32 } from '../lib/conversions';
import { text } from 'stream/consumers';
import { deployMockMerkleProofVerifier } from './helpers/mockMerkleProofVerifier';

import '../lib/keychain';
import { deployMockPantherPoolV0 } from './helpers/mockPantherPoolV0';
import { defaultAbiCoder, keccak256 } from 'ethers/lib/utils';

describe('PantherPoolV0', () => {
    let trees: MockPantherPoolV0;
    let snapshot: number;

    before(async () => {
        trees = await deployMockPantherPoolV0();
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

        describe('TEST-0', function () {
            let tree: TriadMerkleTree;
            const PANTHER_CORE_ZERO_VALUE = BigInt('2896678800030780677881716886212119387589061708732637213728415628433288554509');
            const PANTHER_CORE_TREE_DEPTH_SIZE = 15;
            tree = new TriadMerkleTree(PANTHER_CORE_TREE_DEPTH_SIZE, PANTHER_CORE_ZERO_VALUE, poseidon2or3);

            const amountsOut = [BigInt('7'), BigInt('8'), BigInt('9')];
            const token: BigInt = BigInt('111');
            const createTime: BigInt = BigInt('1651062006');
            const pubKey: BigInt[] = [
                BigInt('18387562449515087847139054493296768033506512818644357279697022045358977016147'),
                BigInt('2792662591747231738854329419102915533513463924144922287150280827153219249810')
            ];
            const commitments = [
                poseidon([pubKey[0], pubKey[1], amountsOut[0], token, createTime]),
                poseidon([pubKey[0], pubKey[1], amountsOut[1], token, createTime]),
                poseidon([pubKey[0], pubKey[1], amountsOut[2], token, createTime])
            ];
            // [0] - First insert
            tree.insertBatch([BigInt(commitments[0]), BigInt(commitments[1]), BigInt(commitments[2])]);

            let merkleProof = [
                tree.genMerklePath(0),
                tree.genMerklePath(1),
                tree.genMerklePath(2)
            ];

            function bnToBuf(bn) {
                // The handy-dandy `toString(base)` works!!
                var hex = BigInt(bn).toString(16);

                // But it still follows the old behavior of giving
                // invalid hex strings (due to missing padding),
                // but we can easily add that back
                if (hex.length % 2) { hex = '0' + hex; }

                // The byteLength will be half of the hex string length
                var len = hex.length / 2;
                var u8 = new Uint8Array(len);

                // And then we can iterate each element by one
                // and each hex segment by two
                var i = 0;
                var j = 0;
                while (i < len) {
                    u8[i] = parseInt(hex.slice(j, j+2), 16);
                    i += 1;
                    j += 2;
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

            //let amount = [BigInt('7'),BigInt('8'),BigInt('9')];
            //let token  = [BigInt('111'),BigInt('112'), BigInt('113')];
            const prolog = 0xEEFFEEFF;
            // [0] - Recipient side
            const s = generateRandomBabyJubValue(); // Spender Private Key
            const S = babyjub.mulPointEscalar(babyjub.Base8, s); // Spender Public Key - Shared & known to sender
            // [1] - Sender side
            const r = generateRandomBabyJubValue(); // Sender generates random value
            // This key used to create commitments with `generateDeposits` solidity call
            const K = babyjub.mulPointEscalar(S,r); // Sender generates Shared Ephemeral Key = rsB = rS
            const R = babyjub.mulPointEscalar(babyjub.Base8, r); // This key is shared in open form = rB
            // [2] - Encrypt text - Version-1: Prolog,Random = 4bytes, 32bytes ( decrypt in place just for test )
            const textToBeCiphered = new Uint8Array( [...bnToBuf(prolog), ...(bnToBuf(r))]);
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
            expect(prolog_from_chain,"extracted from chain prolog must be equal").to.deep.equal(bnToBuf(prolog));
            const r_from_chain = decrypted_from_chain.slice(4,4+32);
            expect(bufToBn(r_from_chain),"extracted from chain random must be equal").equal(r);
            // [4] - TODO: call generateDeposits - with R & cipherTextMessageV1 for each OUT_UTXOs = 3
            /*
            it('GenerateDeposits', async () => {
                await trees.GenerateDeposits();
            });
            */
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

            function concat(arrays) {
                // sum of individual array lengths
                let totalLength = arrays.reduce((acc, value) => acc + value.length, 0);

                let result = new Uint8Array(totalLength);

                if (!arrays.length) return result;

                // for each array - copy it over result
                // next array is copied right after the previous one
                let length = 0;
                for(let array of arrays) {
                    result.set(array, length);
                    length += array.length;
                }

                return result;
            }

            it('GenerateDepositsExt', async () => {
                // This is real token number that will be used inside circom
                const zAssetIdSol = await trees.GetZAssetId(toBytes32(BigInt(111).toString()),toBytes32(BigInt(0).toString()));
                const zAssetIdTs = keccak256(defaultAbiCoder.encode(["uint256","uint256"],[BigInt(111),BigInt(0)]));
                // const zAssetIdTs = defaultAbiCoder.encode(["uint160"],[keccak256(defaultAbiCoder.encode(["uint256","uint256"],[BigInt(111),BigInt(0)]))]);
                // TODO: cast zAssetIdTs to uint160
                // const z = toBigNum(zAssetIdTs);
                // const z1 = Number(z) >> 96;
                // expect(zAssetIdSol, "Solidity token is equal to typescript token").equal( z1 );
                // TODO: uze zAssetIdTs to generate commitment inside TS
                const commitment1 = await trees.GenerateCommitments(spendingPublicKey[0], spendingPublicKey[1], Amounts[0], zAssetIdSol,createdAtNum);
                const commitment2 = await trees.GenerateCommitments(spendingPublicKey[0], spendingPublicKey[1], Amounts[1], zAssetIdSol,createdAtNum);
                const commitment3 = await trees.GenerateCommitments(spendingPublicKey[0], spendingPublicKey[1], Amounts[2], zAssetIdSol,createdAtNum);


                // 0 - leafId, 1 - creationTime, 2 - commitments[3], 3 - secrets[4][3]
                await expect(await trees.GenerateDepositsExtended(tokens, amounts, spendingPublicKey, secrets, createdAt)).
                to.emit(trees, 'NewCommitments').
                withArgs(leftLeafID,createdAtNum,[toBigNum(commitment1.toString()),toBigNum(commitment2.toString()),toBigNum(commitment3.toString())],3);
            });
            /*
            const s1 = generateRandomBabyJubValue();
            const S1 = babyjub.mulPointEscalar(babyjub.Base8, s1);
            const r1 = generateRandomBabyJubValue();
            const K1 = babyjub.mulPointEscalar(S1,r1)[0];
            const R1 = babyjub.mulPointEscalar(babyjub.Base8, r1); //

            const s2 = generateRandomBabyJubValue();
            const S2 = babyjub.mulPointEscalar(babyjub.Base8, s2);
            const r2 = generateRandomBabyJubValue();
            const K2 = babyjub.mulPointEscalar(S2,r2)[0];
            const R2 = babyjub.mulPointEscalar(babyjub.Base8, r2);
            */

            /* function generateDeposits(
                address[OUT_UTXOs] calldata tokens,
                uint256[OUT_UTXOs] calldata tokenIds,
                uint256[OUT_UTXOs] calldata extAmounts,
                G1Point[OUT_UTXOs] calldata pubSpendingKeys, <------------- its `R` [ UTXOs ]
                uint256[CIPHERTEXT1_WORDS][OUT_UTXOs] calldata secrets, <-- its  `cipherTextMessageV1` [ UTXOs ]
                uint256 createdAt) */

            // [5] - TODO: get event secretMsg = cipherTextMessageV1 = 3x256bit, token = 160bit, amount = 32bit = 4x256bit
            // [6] - TODO: unpack them
            // [7] - TODO: from events extract R_packed -> unpack to R
            // [8] - TODO: try to decrypt cipher-msg & test for `prolog` prefix if it there this message is for uu - Measure time of this step please
            // [9] - TODO: extract 'r' & you are ready to execute `exit`
            // [10]- TODO: execute `exit` function to see if you can use locked funds
            // This private key must be used inside `exit` function
            const sr = multiplyScalars(s, r); // spender derived private key
            // This public key must be used in panther-core V1
            const SpenderDerivedPubKey = babyjub.mulPointEscalar(babyjub.Base8, sr); // S = sB S' = srB

        });
    });

});
