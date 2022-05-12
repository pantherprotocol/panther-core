// SPDX-License-Identifier: MIT
import { expect } from 'chai';

// @ts-ignore
import {
    toBytes32, PathElementsType, toBigNum, Triad, PathElementsTypeSend
} from '../lib/utilities';
import { takeSnapshot, revertSnapshot } from './helpers/hardhat';
import { MockMerkleProofVerifier, MockTriadIncrementalMerkleTrees } from '../types';
import { deployMockTrees } from './helpers/mockTriadTrees';
import { poseidon, babyjub } from 'circomlibjs';
import {TriadMerkleTree} from '../lib/tree';
import assert from 'assert';
import { BytesLike } from 'ethers/lib/ethers';
import {generateRandomBabyJubValue,multiplyScalars} from '../lib/keychain';
import { encryptMessage, generateEcdhSharedKey } from '../lib/message-encryption';
import crypto from 'crypto';
import { utils } from 'ethers';
import { bigintToBytes32 } from '../lib/conversions';
import { text } from 'stream/consumers';
import { deployMockMerkleProofVerifier } from './helpers/mockMerkleProofVerifier';

import '../lib/keychain';

describe('MerkleProofVerifier', () => {
    let trees: MockMerkleProofVerifier;
    let snapshot: number;

    before(async () => {
        trees = await deployMockMerkleProofVerifier();
    });

    describe('internal `testVerifyMerkleProof` method - by using circom zkp-input test values', function () {

        describe('a call inserting 3 zero leaves & checking proof for each leaf', function () {

            before(async () => {
                snapshot = await takeSnapshot();
            });

            after(async () => {
                await revertSnapshot(snapshot);
            });

            const amountsOut = [BigInt('7'), BigInt('8'), BigInt('9')];
            const token: BigInt = BigInt('111');
            const createTime: BigInt = BigInt('1651062006');
            const pubKey: BigInt[] = [
                BigInt('18387562449515087847139054493296768033506512818644357279697022045358977016147'),
                BigInt('2792662591747231738854329419102915533513463924144922287150280827153219249810')
            ];
            const commitment0 = poseidon([pubKey[0], pubKey[1], amountsOut[0], token, createTime]);
            const commitment1 = poseidon([pubKey[0], pubKey[1], amountsOut[1], token, createTime]);
            const commitment2 = poseidon([pubKey[0], pubKey[1], amountsOut[2], token, createTime]);

            const merkleRoot = toBytes32('10650828051129756317708141452089125851926509526003232203604419064374393231061');

            const pathElements0 =
                [
                    toBytes32('70575835294174784547258244826603579894295126084098374754150034768326978226'),
                    toBytes32('21165498949491829088726564027049018044359747064678034716482327251128763739323'),
                    toBytes32('5317387130258456662214331362918410991734007599705406860481038345552731150762'),
                    toBytes32('5301900180746108365834837840355741695167403565517259206503735319173783315742'),
                    toBytes32('19759440382600727929415049642887307143518671081639244670052489500787514850212'),
                    toBytes32('11575399251628151734428362828441614938772848828475906566857213866326592241179'),
                    toBytes32('6632555919090241659299800894218068745568431736196896666697681740099319754273'),
                    toBytes32('2313232035512824863888346564211238648697583940443483502600731472911335817854'),
                    toBytes32('12219166190744012474665556054784140979314676975916090596913570678231824844496'),
                    toBytes32('16146864604902996392229526390577377437180881860230124064882884440248322100339'),
                    toBytes32('6883543445806624803603297055410892317599264946303553983246148642156945721809'),
                    toBytes32('11376031557295681140127084012245938798408060888509383225192187436273860950878'),
                    toBytes32('13241605803954237324747758640385138335781780544452364878098724458062976117242'),
                    toBytes32('17855149516804167337625231993818327714748909580849949294952537831754058414670'),
                    toBytes32('5150255556564484319136269061916843962561348275990403501481125286754601797805'),
                    toBytes32('6987786980040962217323608240860512602136308242543772977912408457104385595406'),
                ] as PathElementsType;

            const pathElements1 =
                [
                    toBytes32('5001742625244953632730801981278686902609014698786426456727933168831153597234'),
                    toBytes32('21165498949491829088726564027049018044359747064678034716482327251128763739323'),
                    toBytes32('5317387130258456662214331362918410991734007599705406860481038345552731150762'),
                    toBytes32('5301900180746108365834837840355741695167403565517259206503735319173783315742'),
                    toBytes32('19759440382600727929415049642887307143518671081639244670052489500787514850212'),
                    toBytes32('11575399251628151734428362828441614938772848828475906566857213866326592241179'),
                    toBytes32('6632555919090241659299800894218068745568431736196896666697681740099319754273'),
                    toBytes32('2313232035512824863888346564211238648697583940443483502600731472911335817854'),
                    toBytes32('12219166190744012474665556054784140979314676975916090596913570678231824844496'),
                    toBytes32('16146864604902996392229526390577377437180881860230124064882884440248322100339'),
                    toBytes32('6883543445806624803603297055410892317599264946303553983246148642156945721809'),
                    toBytes32('11376031557295681140127084012245938798408060888509383225192187436273860950878'),
                    toBytes32('13241605803954237324747758640385138335781780544452364878098724458062976117242'),
                    toBytes32('17855149516804167337625231993818327714748909580849949294952537831754058414670'),
                    toBytes32('5150255556564484319136269061916843962561348275990403501481125286754601797805'),
                    toBytes32('6987786980040962217323608240860512602136308242543772977912408457104385595406'),
                ] as PathElementsType;

            const pathElements2 =
                [
                    toBytes32('5001742625244953632730801981278686902609014698786426456727933168831153597234'),
                    toBytes32('70575835294174784547258244826603579894295126084098374754150034768326978226'),
                    toBytes32('5317387130258456662214331362918410991734007599705406860481038345552731150762'),
                    toBytes32('5301900180746108365834837840355741695167403565517259206503735319173783315742'),
                    toBytes32('19759440382600727929415049642887307143518671081639244670052489500787514850212'),
                    toBytes32('11575399251628151734428362828441614938772848828475906566857213866326592241179'),
                    toBytes32('6632555919090241659299800894218068745568431736196896666697681740099319754273'),
                    toBytes32('2313232035512824863888346564211238648697583940443483502600731472911335817854'),
                    toBytes32('12219166190744012474665556054784140979314676975916090596913570678231824844496'),
                    toBytes32('16146864604902996392229526390577377437180881860230124064882884440248322100339'),
                    toBytes32('6883543445806624803603297055410892317599264946303553983246148642156945721809'),
                    toBytes32('11376031557295681140127084012245938798408060888509383225192187436273860950878'),
                    toBytes32('13241605803954237324747758640385138335781780544452364878098724458062976117242'),
                    toBytes32('17855149516804167337625231993818327714748909580849949294952537831754058414670'),
                    toBytes32('5150255556564484319136269061916843962561348275990403501481125286754601797805'),
                    toBytes32('6987786980040962217323608240860512602136308242543772977912408457104385595406'),
                ] as PathElementsType;

            const leafId_0 = BigInt('0');
            const commitment_0 = toBytes32(commitment0);
            it('should be proved - leaf index 0', async () => {
                await trees.testMerkleProof(
                    leafId_0,
                    merkleRoot,
                    commitment_0,
                    pathElements0
                );
                let check = await trees.isProofVerified();
                expect(check == true, "NOT PROVED");
            });

            const leafId_1 = BigInt('1');
            const commitment_1 = toBytes32(commitment1);
            it('should be proved - leaf index 1', async () => {
                await trees.testMerkleProof(
                    leafId_1,
                    merkleRoot,
                    commitment_1,
                    pathElements1
                );
                let check = await trees.isProofVerified();
                expect(check == true, "NOT PROVED");
            });
            const leafId_2 = BigInt('2');
            const commitment_2 = toBytes32(commitment2);
            it('should be proved - leaf index 2', async () => {
                await trees.testMerkleProof(
                    leafId_2,
                    merkleRoot,
                    commitment_2,
                    pathElements2
                );
                let check = await trees.isProofVerified();
                expect(check == true, "NOT PROVED");
            });
        });
    });

    describe('verify proof using zero panther-core tree & solidity verifier', () => {
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

        describe('should be equality between ts & solidity path elements & proof will success', function () {
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

            // These values were extracted from solidity code
            const ShouldBeMerklePathElementsAfterFirstInsert = [
                BigInt('12610959546703067021829481548786041058957588484398889881477381005496514537462'),
                BigInt('3349047423219193406330965173426204517756040645871630854057691440868894250982'),
                BigInt('18389954371877325743937615564349876315640427734567075272665046346265626136419'),
                BigInt('3821922445747924499025173562938580174383118354164359337630642212084359151964'),
                BigInt('15935733969631511252102568819760944197418770481327957873988205677660925018528'),
                BigInt('11782991327328543086851214586786607762143799684091548387988272710726371549961'),
                BigInt('20296808824597379678225500535446241165197388668932210796624301020410505806483'),
                BigInt('4173461319953077503036196915980451538453535748888760632593364006273103304132'),
                BigInt('5766550159403151835612862031619173244724183903452415224168581364310081162759'),
                BigInt('10719667445803564685804016390777214089338112164281015443530526835727343022767'),
                BigInt('21349090590431709965480677812339735277896174812144673690644796244835835356674'),
                BigInt('19531707066138634990416163973328796061422245663290449768207249753220005371133'),
                BigInt('13000046769163827723557373669699328816629124803440350859991091474655812341048'),
                BigInt('8951578653298612361448433248556484464983144095284075554880538299310385645682'),
                BigInt('7870690898942382169582441685508490691047003383534923922466972436590775853570') // ROOT
            ];

            for (let i = 2; i < PANTHER_CORE_TREE_DEPTH_SIZE; i++) {
                let computed = merkleProof[0].pathElements[i][0];
                expect(BigInt(computed)).equal(ShouldBeMerklePathElementsAfterFirstInsert[i - 1], "Must Be Equal");
            }

            // [1] - Second insert
            tree.insertBatch([BigInt(commitments[0]), BigInt(commitments[1]), BigInt(commitments[2])]);

            let merkleProofSecondInsert = [
                tree.genMerklePath(3),
                tree.genMerklePath(4),
                tree.genMerklePath(5)
            ];

            let ShouldBeMerklePathElementsAfterSecondInsert = [
                BigInt('2036430464785539673097545458320380514076050513668437280501170446145938050826'),
                BigInt('3349047423219193406330965173426204517756040645871630854057691440868894250982'),
                BigInt('18389954371877325743937615564349876315640427734567075272665046346265626136419'),
                BigInt('3821922445747924499025173562938580174383118354164359337630642212084359151964'),
                BigInt('15935733969631511252102568819760944197418770481327957873988205677660925018528'),
                BigInt('11782991327328543086851214586786607762143799684091548387988272710726371549961'),
                BigInt('20296808824597379678225500535446241165197388668932210796624301020410505806483'),
                BigInt('4173461319953077503036196915980451538453535748888760632593364006273103304132'),
                BigInt('5766550159403151835612862031619173244724183903452415224168581364310081162759'),
                BigInt('10719667445803564685804016390777214089338112164281015443530526835727343022767'),
                BigInt('21349090590431709965480677812339735277896174812144673690644796244835835356674'),
                BigInt('19531707066138634990416163973328796061422245663290449768207249753220005371133'),
                BigInt('13000046769163827723557373669699328816629124803440350859991091474655812341048'),
                BigInt('8951578653298612361448433248556484464983144095284075554880538299310385645682'),
                BigInt('5080802032616611841695934472369605256187370514682593051886813285782187880244') // ROOT
            ];

            for (let i = 2; i < PANTHER_CORE_TREE_DEPTH_SIZE; i++) {
                let computed = merkleProofSecondInsert[0].pathElements[i][0];
                expect(BigInt(computed)).equal(ShouldBeMerklePathElementsAfterSecondInsert[i - 1], "Must Be Equal");
            }

            // [3] - Third insert
            tree.insertBatch([BigInt(commitments[0]), BigInt(commitments[1]), BigInt(commitments[2])]);

            let merkleProofThirdInsert = [
                tree.genMerklePath(6),
                tree.genMerklePath(7),
                tree.genMerklePath(8)
            ];

            let ShouldBeMerklePathElementsAfterThirdInsert = [
                BigInt('12610959546703067021829481548786041058957588484398889881477381005496514537462'),
                BigInt('6593769061588505652796652368972428248449904784599508005290567407050120675396'),
                BigInt('18389954371877325743937615564349876315640427734567075272665046346265626136419'),
                BigInt('3821922445747924499025173562938580174383118354164359337630642212084359151964'),
                BigInt('15935733969631511252102568819760944197418770481327957873988205677660925018528'),
                BigInt('11782991327328543086851214586786607762143799684091548387988272710726371549961'),
                BigInt('20296808824597379678225500535446241165197388668932210796624301020410505806483'),
                BigInt('4173461319953077503036196915980451538453535748888760632593364006273103304132'),
                BigInt('5766550159403151835612862031619173244724183903452415224168581364310081162759'),
                BigInt('10719667445803564685804016390777214089338112164281015443530526835727343022767'),
                BigInt('21349090590431709965480677812339735277896174812144673690644796244835835356674'),
                BigInt('19531707066138634990416163973328796061422245663290449768207249753220005371133'),
                BigInt('13000046769163827723557373669699328816629124803440350859991091474655812341048'),
                BigInt('8951578653298612361448433248556484464983144095284075554880538299310385645682'),
                BigInt('12639523502428448254562583832651707893831215707918737401127830898440049948195') // ROOT
            ];

            for (let i = 2; i < PANTHER_CORE_TREE_DEPTH_SIZE; i++) {
                let computed = merkleProofThirdInsert[0].pathElements[i][0];
                expect(BigInt(computed)).equal(ShouldBeMerklePathElementsAfterThirdInsert[i - 1], "Must Be Equal");
            }
            // DONT REMOVE THIS CODE - Its used to make tests on MT solidity version
            it('should solidity `PathElements` be proofed by solidity verifier', async () => {
                const commitment0 = poseidon([pubKey[0], pubKey[1], amountsOut[0], token, createTime]);
                const commitment1 = poseidon([pubKey[0], pubKey[1], amountsOut[1], token, createTime]);
                const commitment2 = poseidon([pubKey[0], pubKey[1], amountsOut[2], token, createTime]);
                const c1 = toBytes32(commitment0);
                const c2 = toBytes32(commitment1);
                const c3 = toBytes32(commitment2);
                const commitmentsLeavesTriadNumber = [c1, c2, c3] as Triad;
                // TODO: increase this to few millions and move to long test
                for (let trys = 0; trys < 16; ++trys) {
                    await trees.internalInsertBatchZkp(commitmentsLeavesTriadNumber);
                    let elements = await trees.PathElements();
                    let leafID = await trees.LeafId();
                    let merkleRoot = elements[14];
                    it('should be proved', async () => {
                        let PathElements: PathElementsType = [
                            <BytesLike>commitment1,
                            <BytesLike>commitment2,
                            <BytesLike>elements[0],
                            <BytesLike>elements[1],
                            <BytesLike>elements[2],
                            <BytesLike>elements[3],
                            <BytesLike>elements[4],
                            <BytesLike>elements[5],
                            <BytesLike>elements[6],
                            <BytesLike>elements[7],
                            <BytesLike>elements[8],
                            <BytesLike>elements[9],
                            <BytesLike>elements[10],
                            <BytesLike>elements[11],
                            <BytesLike>elements[12],
                            <BytesLike>elements[13]
                        ];
                        await trees.testMerkleProof(
                            leafID,
                            merkleRoot,
                            commitment0,
                            PathElements
                        );
                        let check = await trees.isProofVerified();
                        expect(check, "NOT PROVED").equal(true);
                    });
                }
            });
        });

        describe('Crypto infra tests', () => {

            describe('Spend & Random Keys generation should be equal to solidity side', async () => {
                // TODO: increase to billion + logn-test
                for(let i = 0; i < 8; ++i) {
                    // [0] - spender will generate it and share its public key with sender
                    const s = generateRandomBabyJubValue();
                    const S = babyjub.mulPointEscalar(babyjub.Base8, s);
                    // [1] - Solidity code
                    const Ssol = await trees.GeneratePublicSpendingKey(s);
                    // [2] - Check
                    it('SpenderDerivedPubKeyTypeScript == SpenderDerivedPubKeySolidity', () => {
                        expect(S[0]).equal(Ssol[0]);
                        expect(S[1]).equal(Ssol[1]);
                    });
                }
            });

            // This code used for checks inside snarks - don't change it please (Roma)
            describe('Spend & Random Keys generation', () => {
                // [0] - spender will generate it and share its public key with sender
                const s = generateRandomBabyJubValue();
                const S = babyjub.mulPointEscalar(babyjub.Base8, s);
                //console.log("SpenderRootPubKey:", S);
                //console.log("SpenderRootPrivKey:", s);
                // [1] - random value generated by sender and shared via encrypted message
                const r = generateRandomBabyJubValue();
                //console.log("SenderRandom:", r);
                // [2] - SpenderDerivedPubKey - generated by sender and used to create UTXO output
                const SpenderDerivedPubKeyOnSenderSide = babyjub.mulPointEscalar(S, r); // S = sB, S' = rsB
                //console.log("SpenderDerivedPubKeyOnSenderSide:", SpenderDerivedPubKeyOnSenderSide[0], SpenderDerivedPubKeyOnSenderSide[1]);
                // [3] - Spender provides its privKey * Random to generate SpenderDerivedPrivateKey - checked inside snarks that it can generate pub-key
                const sr = multiplyScalars(s, r);
                //console.log("SpenderDerivedPrivKeyOnRecipientSide:", sr );
                // [4] - Generate SpenderDerivedPubKey - this key used to create UTXO we are trying to spend
                // Circuit take s' = sr
                // 1) used to generate S' and use it as input to MT
                // 2) s' also used inside nullifier - to check that hash is OK.
                const SpenderDerivedPubKeyOnRecipientSide = babyjub.mulPointEscalar(babyjub.Base8, sr); // S = sB S' = srB
                //console.log("SpenderDerivedPubKeyOnRecipientSide (must be generated by circom and checked):", SpenderDerivedPubKeyOnRecipientSide[0],SpenderDerivedPubKeyOnSenderSide[1]);
                // [5] - Check equality
                describe('should be equal', () => {
                    it('SpenderDerivedPubKeyOnRecipientSide == SpenderDerivedPubKeyOnSenderSide', () => {
                        expect(SpenderDerivedPubKeyOnRecipientSide[0].toString()).equal( SpenderDerivedPubKeyOnSenderSide[0].toString());
                        expect(SpenderDerivedPubKeyOnRecipientSide[1].toString()).equal( SpenderDerivedPubKeyOnSenderSide[1].toString());
                    });
                });
            });

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

            describe('CipherTest encryption decryption', () => {
                let amount = [BigInt('7'),BigInt('8'),BigInt('9')];
                let token  = [BigInt('111'),BigInt('112'), BigInt('113')];
                const prolog = 0xEEFFEEFF;
                // [0] - Recipient side
                const s = generateRandomBabyJubValue(); // Spender Private Key
                const S = babyjub.mulPointEscalar(babyjub.Base8, s); // Spender Public Key - Shared & known to sender
                // [1] - Sender side
                const r = generateRandomBabyJubValue(); // Sender generates random value
                // This key used to create commitments with `generateDeposits` solidity call
                const K = babyjub.mulPointEscalar(S,r)[0]; // Sender generates Shared Ephemeral Key = rsB = rS
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
                    utils.arrayify(bigintToBytes32(K)), // Are we sure its only X , and no Y is used here
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
                const Ktag = babyjub.mulPointEscalar(R,s)[0]; // Sender generates Shared Ephemeral Key = rsB = rS
                const decipher = crypto.createDecipheriv(
                    'aes-256-cbc',
                    utils.arrayify(bigintToBytes32(Ktag)),
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

                const K_from_chain = babyjub.mulPointEscalar(R_unpacked,s)[0]; // Sender generates Shared Ephemeral Key = rsB = rS
                const decipher_from_chain = crypto.createDecipheriv(
                    'aes-256-cbc',
                    utils.arrayify(bigintToBytes32(K_from_chain)),
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

                // [111] - Solidity code
                //const Ssol = await trees.GeneratePublicSpendingKey(s);
                // [112] - Check
                //it('SpenderDerivedPubKeyTypeScript == SpenderDerivedPubKeySolidity', () => {
                //    expect(S[0]).equal(Ssol[0]);
                //    expect(S[1]).equal(Ssol[1]);
                //});
            });

        });
    });

});
