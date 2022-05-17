// SPDX-License-Identifier: MIT
import { expect } from 'chai';

// @ts-ignore
import { toBytes32, PathElementsType, Triad, Pair } from '../lib/utilities';
import { takeSnapshot, revertSnapshot } from './helpers/hardhat';
import { MockPantherPoolV0 } from '../types';
import { poseidon, babyjub } from 'circomlibjs';
import { TriadMerkleTree } from '../lib/tree';
import assert from 'assert';
import { BytesLike } from 'ethers/lib/ethers';
import { deriveKeypairFromSeed, generatePublicKey, generateRandomBabyJubValue, multiplyScalars } from '../lib/keychain';
import { generateEcdhSharedKeyPoint } from '../lib/message-encryption';
import crypto from 'crypto';
import { BigNumber, utils } from 'ethers';
import { bigintToBytes32 } from '../lib/conversions';
import '../lib/keychain';
import { deployMockPantherPoolV0 } from './helpers/mockPantherPoolV0';
import { Buffer } from 'buffer';
import { IKeypair } from '../lib/types/keypair';

describe('PantherPoolV0', () => {
    let poolV0: MockPantherPoolV0;
    let snapshot: number;

    before(async () => {
        poolV0 = await deployMockPantherPoolV0();
    });

    describe('Test GenerateDeposits & Exit with all token-types', () => {
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

        // TODO: move it to utils or lib since its related to pack-unpack operation
        function BigIntToBuffer32(bn) {
            // The handy-dandy `toString(base)` works!!
            let hex = BigInt(bn).toString(16);

            // But it still follows the old behavior of giving
            // invalid hex strings (due to missing padding),
            // but we can easily add that back
            if (hex.length % 2) { hex = '0' + hex; }

            // The byteLength will be half of the hex string length
            let len = hex.length / 2;
            let u8 = new Uint8Array(32); //len);

            // And then we can iterate each element by one
            // and each hex segment by two
            let i = 0;
            let j = 0;
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
            return u8;
        }

        // TODO: move it to utils or lib since its related to pack-unpack operation
        function Buffer32ToBigInt(buf) {
            let hex : string[] = [];
            let u8 = Uint8Array.from(buf);

            u8.forEach(function (i) {
                let h = i.toString(16);
                if (h.length % 2) { h = '0' + h; }
                hex.push(h);
            });

            return BigInt('0x' + hex.join(''));
        }

        class TransactionOut {
            // This value is used to be packed inside cipher text
            readonly spenderRandom : BigInt;
            // This value is used to create commitments that only user that knows `s-private` & spenderRandom can spend
            // Its equal to spenderRandom * S = S'
            readonly spenderPubKey : BigInt[];
            // This value is used to create ephemeral public Key and use this key as key to cipher text
            readonly ephemeralRandom : BigInt;
            // This value is ephemeralRandom * S - used to cipher text
            readonly ephemeralPubKey : BigInt[];
            // Packed version
            readonly ephemeralPubKeyPacked : Buffer;
            // This value is used to be shared in open form - ephemeralRandom * B
            // Since spender side knows 's' -> s * ephemeralRandom * B = s * B * ephemeralRandom
            readonly ephemeralSharedPubKey : BigInt[];
            // Packed version
            readonly ephemeralSharedPubKeyPacked : Buffer;
            // IV 16 bytes - 128 bit for encryption
            readonly iv : Buffer;
            // Text to be ciphered
            cipheredText : Uint8Array;
            // Text to be send on-chain
            cipheredTextMessageV1 : Uint8Array;

            public constructor (spenderRootPubKey) {
                this.spenderRandom = generateRandomBabyJubValue();
                this.spenderPubKey = generatePublicKey(this.spenderRandom);
                this.ephemeralRandom = generateRandomBabyJubValue();
                this.ephemeralPubKey = generateEcdhSharedKeyPoint(this.ephemeralRandom,spenderRootPubKey);
                this.ephemeralPubKeyPacked = babyjub.packPoint(this.ephemeralPubKey);
                this.ephemeralSharedPubKey = generatePublicKey(this.ephemeralRandom);
                this.ephemeralSharedPubKeyPacked = babyjub.packPoint(this.ephemeralSharedPubKey);
                this.iv = crypto.randomBytes(16);
                this.cipheredText = crypto.randomBytes(48);
                this.cipheredTextMessageV1 = crypto.randomBytes(96);
            }

            public encryptMessageV1() {
                // [0] - Pack prolog & random
                // Version-1: Prolog,Random = 4bytes, 32bytes ( decrypt in place just for test )
                const prolog = 0xEEFFEEFF; // THIS prolog must be used as is, according to specs
                const textToBeCiphered = new Uint8Array( [...BigIntToBuffer32(prolog).slice(0,4), ...(BigIntToBuffer32(this.spenderRandom))]);
                if ( textToBeCiphered.length != 36 ) {
                    throw "Size of text to be ciphered V1 must be equal to 36 bytes";
                }
                // [1] - cipher
                // const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv(
                    'aes-256-cbc',
                    this.ephemeralPubKeyPacked,
                    this.iv
                );
                const cipheredText1 = cipher.update(textToBeCiphered);
                const cipheredText2 = cipher.final();
                // [2] - semi-pack
                this.cipheredText = new Uint8Array([...cipheredText1,...cipheredText2]);
                if ( this.cipheredText.length != 48 ) {
                    throw "Size of ciphered text V1 must be equal to 48 bytes";
                }
            }

            public packCipheredText() {
                this.cipheredTextMessageV1 = new Uint8Array([...this.iv, ...this.ephemeralSharedPubKeyPacked, ...this.cipheredText]);
            }

        };

        class TransactionIn {
            // Only spender have it
            readonly spenderRootKeys : IKeypair;
            // Value that must be extracted from ciphered-text
            spenderRandom : BigInt;
            // Value that must be derived from random & root priv-key in order to be able to spend
            spenderPubKey : BigInt[];
            // Value that must be derived in order to decrypt ciphered text
            ephemeralPubKey : BigInt[];
            ephemeralPubKeyPacked : Uint8Array;
            // Value that used to reconstruct ephemeralPubKey in order to be able to decrypt
            ephemeralSharedPubKey : BigInt[];
            ephemeralSharedPubKeyPacked : Uint8Array;
            iv : Uint8Array;
            cipheredTextMessageV1 : Uint8Array;
            cipheredText : Uint8Array;
            decryptedText: Uint8Array;

            constructor(spenderRootKeys : IKeypair) {
                // [0] - Real keys
                this.spenderRootKeys = spenderRootKeys;
                // [1] - Random values to be on safe side
                this.spenderRandom = generateRandomBabyJubValue();
                this.spenderPubKey = generatePublicKey(generateRandomBabyJubValue());
                this.ephemeralPubKey = generatePublicKey(generateRandomBabyJubValue());
                this.ephemeralPubKeyPacked = BigIntToBuffer32(generateRandomBabyJubValue());
                this.ephemeralSharedPubKey = generatePublicKey(generateRandomBabyJubValue());
                this.ephemeralSharedPubKeyPacked = BigIntToBuffer32(generateRandomBabyJubValue());
                this.iv = crypto.randomBytes(16);
                this.cipheredTextMessageV1 = crypto.randomBytes(96);
                this.cipheredText = crypto.randomBytes(48);
                this.decryptedText = crypto.randomBytes(32);
            }

            unpackRandomAndCheckProlog() {
                // [0] - Prolog check
                const prolog = BigInt(0xEEFFEEFF);
                const prolog_from_chain = Buffer32ToBigInt(this.decryptedText.slice(0,0+4));
                if( prolog_from_chain != prolog ) {
                    throw "Prolog V1 is not equal";
                }
                // [1] - Unpack random - from now on funds can be spent
                this.spenderRandom = Buffer32ToBigInt(this.decryptedText.slice(4,4+32));
            }

            public decryptMessageV1() {
                // [0] - decipher - if fails it will throw
                const decipher = crypto.createDecipheriv(
                    'aes-256-cbc',
                    this.ephemeralPubKeyPacked,
                    this.iv
                );
                const decrypted1 = decipher.update(this.cipheredText);
                const decrypted2 = decipher.final();
                // [2] - semi-unpack
                this.decryptedText = new Uint8Array([...decrypted1,...decrypted2]);
                if ( this.decryptedText.length != 36 ) {
                    throw "decrypted text V1 must be equal to 36 bytes";
                }
            }

            public unpackMessageV1(cipheredTextMessageV1 : Uint8Array) {
                // [0] - check size
                if(cipheredTextMessageV1.length != this.cipheredTextMessageV1.length) {
                    throw "CipheredTextMessageV1 must be equal to 96";
                }
                this.cipheredTextMessageV1 = cipheredTextMessageV1;
                // [1] - IV
                this.iv = this.cipheredTextMessageV1.slice(0,0+16);
                // [2] - Keys
                this.ephemeralSharedPubKeyPacked = this.cipheredTextMessageV1.slice(16,16+32);
                this.ephemeralSharedPubKey = babyjub.unpackPoint(this.ephemeralSharedPubKeyPacked);
                this.ephemeralPubKey = babyjub.mulPointEscalar(this.ephemeralSharedPubKey,this.spenderRootKeys.privateKey);
                this.ephemeralPubKeyPacked = babyjub.packPoint(this.ephemeralPubKey);
                // [3] - Ciphered text
                this.cipheredText = this.cipheredTextMessageV1.slice(48,48+48);
            }
        };

        describe('Keys generation & other cryptography used in advanced-staking', function () {
            // [0] - Spender side generation - one time - Root public key will be shared
            const spenderSeed = BigInt("0xAABBCCDDEEFF");
            const spenderRootKeys = deriveKeypairFromSeed(spenderSeed);
            // [1] - Sender side generation - for every new tx
            const tx = new TransactionOut(spenderRootKeys.publicKey);
            // [2] - Encrypt ( can throw ... )
            tx.encryptMessageV1();
            // [3] - Pack & Serialize - after this step data can be sent on chain
            tx.packCipheredText();
            // [4] - Send on-chain -> extract event etc ...
            // ///////////////////////////////////////////// SEND ON CHAIN /////////////////////////////////////////////
            const txIn = new TransactionIn(spenderRootKeys);
            // [5] - Deserialize --- we actually will first get this text from chain
            txIn.unpackMessageV1(tx.cipheredTextMessageV1);
            // [6] - Decrypt ( try... )
            try {
                txIn.decryptMessageV1();
            } catch (e) {
                // can't decrypt - this message is not for us
            }
            // [7] - Extract random ( try ... )
            try {
                txIn.unpackRandomAndCheckProlog();
            } catch (e) {
                // prolog is not equal to expected
            }
            // [8] - We ready to use random in spend flow
            it("Sent random is equal to received random", () => {
                expect(txIn.spenderRandom).equal(tx.spenderRandom);
            })
        });


        // TODO: This flow must be re-factored to functions
        // All related to crytography must be double checked in code: all `expects` must hold in production code,
        //     and if not, re-try procedure must be taken, for example:
        // Create Keys and encrypts message and pack to be send on-chain -> try to extract & decrypt & recreate-commitments
        // If it fails re-try procedure will be re-creation of all created-keys
        // In production new-key can't be used without this double-test
        describe('Flow of key-generation, commitments creation (ERC20), generate-deposits + exit && double checks on every-step', function () {
            // [0] - Recipient side
            const s = generateRandomBabyJubValue(); // Spender Private Key
            const S = babyjub.mulPointEscalar(babyjub.Base8, s); // Spender Public Key - Shared & known to sender
            // [1] - Sender side - NOTE: 2 different randoms can be created - One for Ephemeral Key and one for speding
            // We use here same random for both for simplicity
            const r = generateRandomBabyJubValue(); // Sender generates random value
            // This key used to create commitments with `generateDeposits` solidity call
            const K = babyjub.mulPointEscalar(S,r); // Sender generates Shared Ephemeral Key = rsB = rS
            const R = babyjub.mulPointEscalar(babyjub.Base8, r); // This key is shared in open form = rB
            // [2] - Encrypt text - Version-1: Prolog,Random = 4bytes, 32bytes ( decrypt in place just for test )
            const prolog = 0xEEFFEEFF; // THIS prolog must be used as is, according to specs
            const textToBeCiphered = new Uint8Array( [...BigIntToBuffer32(prolog).slice(0,4), ...(BigIntToBuffer32(r))]);
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
            expect(prolog_from_chain,"extracted from chain prolog must be equal").to.deep.equal(BigIntToBuffer32(prolog).slice(0,4));
            const r_from_chain = decrypted_from_chain.slice(4,4+32);
            // TODO: something here sometimes not plays correctly - it must be wrapped inside "if" and if not log everything & re-try recreating all keys.
            expect(Buffer32ToBigInt(r_from_chain),"extracted from chain random must be equal").equal(r);
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
                toBytes32(Buffer32ToBigInt(cipherTextMessageV1.slice(0, 32)).toString()),
                toBytes32(Buffer32ToBigInt(cipherTextMessageV1.slice(32, 64)).toString()),
                toBytes32(Buffer32ToBigInt(cipherTextMessageV1.slice(64, 96)).toString()),
            ] as Triad;

            const createdAtNum = BigInt('1652375774');
            const createdAt = toBytes32(createdAtNum.toString());
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

                // Double check commitments vs solidity side
                // TODO: implement same check by calling web-assembly of circom
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
                const zAssetIdBuf1 = BigIntToBuffer32(zAssetIdSol);
                const amountBuf1 = BigIntToBuffer32(Amounts[0]);
                const merged1 = new Uint8Array([...zAssetIdBuf1.slice(0, 20), ...amountBuf1.slice(0, 12).reverse()]);
                const secrets_from_chain1 = [
                    {
                        "_hex": toBytes32(Buffer32ToBigInt(cipherTextMessageV1.slice(0, 32)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(Buffer32ToBigInt(cipherTextMessageV1.slice(32, 64)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(Buffer32ToBigInt(cipherTextMessageV1.slice(64, 96)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(Buffer32ToBigInt(merged1).toString()),
                        "_isBigNumber": true
                    },
                ];
                const secrets_from_chain11 : BigNumber[] =
                    [
                    BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(0, 32)).toString()),
                    BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(32, 64)).toString()),
                    BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(64, 96)).toString()),
                    BigNumber.from(Buffer32ToBigInt(merged1).toString())
                ];

                const zAssetIdBuf2 = BigIntToBuffer32(zAssetIdSol);
                const amountBuf2 = BigIntToBuffer32(Amounts[1]);
                const merged2 = new Uint8Array([...zAssetIdBuf2.slice(0, 20), ...amountBuf2.slice(0, 12).reverse()]);
                const secrets_from_chain2 = [
                    {
                        "_hex": toBytes32(Buffer32ToBigInt(cipherTextMessageV1.slice(0, 32)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(Buffer32ToBigInt(cipherTextMessageV1.slice(32, 64)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(Buffer32ToBigInt(cipherTextMessageV1.slice(64, 96)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(Buffer32ToBigInt(merged2).toString()),
                        "_isBigNumber": true
                    },
                ];
                const secrets_from_chain22 : BigNumber[] = [
                    BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(0, 32)).toString()),
                    BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(32, 64)).toString()),
                    BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(64, 96)).toString()),
                    BigNumber.from(Buffer32ToBigInt(merged2).toString())
                ];

                const zAssetIdBuf3 = BigIntToBuffer32(zAssetIdSol);
                const amountBuf3 = BigIntToBuffer32(Amounts[2]);
                const merged3 = new Uint8Array([...zAssetIdBuf3.slice(0, 20), ...amountBuf3.slice(0, 12).reverse()]);
                const secrets_from_chain3 = [
                    {
                        "_hex": toBytes32(Buffer32ToBigInt(cipherTextMessageV1.slice(0, 32)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(Buffer32ToBigInt(cipherTextMessageV1.slice(32, 64)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(Buffer32ToBigInt(cipherTextMessageV1.slice(64, 96)).toString()),
                        "_isBigNumber": true
                    },
                    {
                        "_hex": toBytes32(Buffer32ToBigInt(merged3).toString()),
                        "_isBigNumber": true
                    },
                ];
                const secrets_from_chain33 : BigNumber[] = [
                    BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(0, 32)).toString()),
                    BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(32, 64)).toString()),
                    BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(64, 96)).toString()),
                    BigNumber.from(Buffer32ToBigInt(merged3).toString())
                ];
                // TODO: Add call to GenerateDepositsExtended with check of events parameters, see example ---
                // 0 - leafId, 1 - creationTime, 2 - commitments[3], 3 - secrets[4][3]
                const tx = await poolV0.GenerateDepositsExtended(tokens, amounts, spendingPublicKey, secrets, createdAt);
                const rcp = await tx.wait();
                //console.log("rcp.logs[0]:" , rcp.events[0]);
                //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                // Pay attention something inside [secrets] type not working - values are OK, but wrapping-type is not what is expected //
                // In order to make await expect(await poolV0.GenerateDepositsExtended(...).to.emit(...).withArgs() work                //
                // One need to patch ethers-waffle lib to support correct equality applied to arrays, otherwise beside the fact
                // that arrays are equal still it will fail... to match it.
                // This code must be patched: node_modules/@ethereum-waffle/chai/dist/cjs/matchers/emit.js line 48
                // if(Array.isArray(actualArgs[index][j]) || Array.isArray(expectedArgs[index][j])) {
                //     new Assertion(actualArgs[index][j]).to.deep.equal(expectedArgs[index][j]);
                // } else {
                //     new Assertion(actualArgs[index][j]).equal(expectedArgs[index][j]);
                // }
                // I also don't understand why there is no problem with commitments array but there is problem with
                // secrets array of arrays
                /*
                const Secrets = [
                    [
                        BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(0, 32)).toString()),
                        BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(32, 64)).toString()),
                        BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(64, 96)).toString()),
                        BigNumber.from(Buffer32ToBigInt(merged1).toString())
                    ] as const,
                    [
                        BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(0, 32)).toString()),
                        BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(32, 64)).toString()),
                        BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(64, 96)).toString()),
                        BigNumber.from(Buffer32ToBigInt(merged2).toString())
                    ] as const,
                    [
                        BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(0, 32)).toString()),
                        BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(32, 64)).toString()),
                        BigNumber.from(Buffer32ToBigInt(cipherTextMessageV1.slice(64, 96)).toString()),
                        BigNumber.from(Buffer32ToBigInt(merged3).toString())
                    ] as const,
                ] as const;
                const leftLeafID = 0;
                await expect(await poolV0.GenerateDepositsExtended(tokens, amounts, spendingPublicKey, secrets, createdAt)).to.emit(poolV0, 'NewCommitments').withArgs(
                    leftLeafID,
                    createdAtNum,
                    CommitmentsFromSolidity,
                    Secrets
                    //[
                        //commitment1,
                        //commitment2,
                        //commitment3
                    //],
                    //[
                    //    secrets_from_chain11,
                    //    secrets_from_chain22,
                    //    secrets_from_chain33
                    //]
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
                const sr = multiplyScalars(s, Buffer32ToBigInt(r_from_chain)); // spender derived private key

                // This public key must be used in panther-core V1
                const SpenderDerivedPubKey = babyjub.mulPointEscalar(babyjub.Base8, sr); // S = sB S' = srB
                const SpenderDerivedPubKey_from_chain = await poolV0.GeneratePublicSpendingKey(sr as bigint);
                expect(SpenderDerivedPubKey[0],"Generated Public Key TS must be equal to solidity version").equal(SpenderDerivedPubKey_from_chain[0]);
                expect(SpenderDerivedPubKey[1],"Generated Public Key TS must be equal to solidity version").equal(SpenderDerivedPubKey_from_chain[1]);
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
                // TODO: get real-left-leaf-id from chain & check to computed by merkle-tree ts.
                const lefLeafId = 0;
                // TODO: use different token-id & token & token type in order to simulate not only ERC-20
                const tokenId = 0;
                const cacheIndexHint = 0; // don't use cache
                const checkRoot = await poolV0.isKnownRoot(0,toBytes32(BigInt(merkleProof[0].root).toString()),0);
                expect(checkRoot, "isKnownRoot must be true").equal(true);
                const checkZAsset = await poolV0.IsKnownZAsset(Token,tokenId);
                expect(checkZAsset, "IsKnownZAsset must be true").equal(true);
                await poolV0.Exit(
                    Token,
                    tokenId,
                    amountsOut[0],
                    createTime,
                    sr as bigint,
                    lefLeafId,
                    pathElements,
                    toBytes32(BigInt(merkleProof[0].root).toString()),
                    cacheIndexHint
                );
            });
        });
    });
});
