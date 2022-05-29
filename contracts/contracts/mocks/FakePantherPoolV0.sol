// SPDX-License-Identifier: UNLICENSED
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import { CIPHERTEXT1_WORDS, OUT_UTXOs, PATH_ELEMENTS_NUM } from "../common/Constants.sol";
import { G1Point } from "../common/Types.sol";
import "../interfaces/IPantherPoolV0.sol";

/// @dev It simulates (but not precisely!!!) `IPantherPoolV0`. See an example bellow.
contract FakePantherPoolV0 is IPantherPoolV0 {
    // solhint-disable var-name-mixedcase

    // Snark field size
    uint256 private constant FIELD_SIZE =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    // Leaf zero value (`keccak256("Pantherprotocol")%FIELD_SIZE`)
    bytes32 internal constant ZERO_VALUE =
        bytes32(
            uint256(
                0x667764c376602b72ef22218e1673c2cc8546201f9a77807570b3e5de137680d
            )
        );

    address public immutable override VAULT;
    uint256 public immutable EXIT_TIME;

    // solhint-enable var-name-mixedcase

    uint256 public fakeLeavesNum;

    mapping(bytes32 => bool) public isSpent;

    constructor(address anyVaultAddress, uint256 exitTime) {
        VAULT = anyVaultAddress;
        EXIT_TIME = exitTime;
    }

    // It fakes generation of deposits and emits
    function generateDeposits(
        address[OUT_UTXOs] calldata tokens,
        uint256[OUT_UTXOs] calldata tokenIds,
        uint256[OUT_UTXOs] calldata extAmounts,
        G1Point[OUT_UTXOs] calldata pubSpendingKeys,
        uint256[CIPHERTEXT1_WORDS][OUT_UTXOs] calldata secrets,
        uint32 createdAt
    ) external override returns (uint256 leftLeafId) {
        require(
            createdAt <= block.timestamp,
            "FakePantherPoolV0:TOO_LARGE_createdAt"
        );
        bytes32[OUT_UTXOs] memory commitments;
        bytes memory utxoData = "";

        for (uint256 utxoIndex = 0; utxoIndex < OUT_UTXOs; utxoIndex++) {
            require(
                pubSpendingKeys[utxoIndex].x < FIELD_SIZE,
                "FakePantherPoolV0:ERR_TOO_LARGE_PUBKEY.x"
            );
            require(
                pubSpendingKeys[utxoIndex].x < FIELD_SIZE,
                "FakePantherPoolV0:ERR_TOO_LARGE_PUBKEY.x"
            );
            require(
                tokenIds[utxoIndex] < FIELD_SIZE,
                "FakePantherPoolV0:TOO_LARGE_tokenId"
            );
            require(
                extAmounts[utxoIndex] < 2**96,
                "FakePantherPoolV0:ERR_TOO_LARGE_AMOUNT"
            );
            require(
                extAmounts[utxoIndex] != 0 ||
                    (tokens[utxoIndex] == address(0) &&
                        tokenIds[utxoIndex] == 0),
                "FakePantherPoolV0:ERR_WRONG_DEPOSIT"
            );

            bytes memory thisUtxoData;
            if (extAmounts[utxoIndex] == 0) {
                // zero UTXO
                commitments[utxoIndex] = ZERO_VALUE;
                // UTXO_DATA_TYPE_ZERO
                thisUtxoData = bytes.concat(abi.encodePacked(uint8(0xA0)));
            } else {
                // Fake (!!!) the commitment
                commitments[utxoIndex] = bytes32(
                    uint256(keccak256(abi.encode(block.timestamp, utxoIndex))) %
                        FIELD_SIZE
                );

                // No scaling (!!!)
                uint256 scaledAmount = extAmounts[utxoIndex];
                uint256 tokenAndAmount = (uint256(uint160(tokens[utxoIndex])) <<
                    96) | scaledAmount;

                thisUtxoData = abi.encodePacked(
                    uint8(0xAB), // UTXO_DATA_TYPE1
                    secrets[utxoIndex],
                    tokenAndAmount,
                    tokenIds[utxoIndex]
                );
            }

            utxoData = bytes.concat(utxoData, thisUtxoData);
        }

        uint256 n = fakeLeavesNum;
        leftLeafId = ((n / 3) * 4) + (n % 3);
        fakeLeavesNum = n + OUT_UTXOs;

        emit NewCommitments(
            leftLeafId,
            block.timestamp, // creationTime,
            commitments,
            utxoData
        );
    }

    function exit(
        address, // token,
        uint256, // tokenId,
        uint256 amount,
        uint32, // creationTime,
        uint256 privSpendingKey,
        uint256 leafId,
        bytes32[PATH_ELEMENTS_NUM] calldata, // pathElements,
        bytes32, // merkleRoot,
        uint256 // cacheIndexHint
    ) external override {
        require(
            block.timestamp >= EXIT_TIME,
            "FakePantherPoolV0:ERR_TOO_EARLY_EXIT"
        );
        require(amount < 2**96, "FakePantherPoolV0:ERR_TOO_LARGE_AMOUNT");

        // Fake (!!!) nullifier
        bytes32 nullifier = bytes32(
            uint256(keccak256(abi.encode(privSpendingKey, leafId))) % FIELD_SIZE
        );

        require(!isSpent[nullifier], "FakePantherPoolV0:ERR_SPENT_NULLIFIER");
        isSpent[nullifier] = true;
        emit Nullifier(nullifier);
    }

    function grant(address grantee, bytes4 grantType)
        external
        override
        returns (uint256 prpAmount)
    {
        // bytes4(keccak256("forAdvancedStakeGrant"))
        require(
            grantType == bytes4(0x31a180d4),
            "FakePantherPoolV0: INVALID_GRANT_TYPE"
        );

        prpAmount = 1000;
        emit PrpGrantIssued(grantType, grantee, prpAmount);
    }
}

// TODO: write FakePantherPoolV0::generateDeposits u-test based on the following example
/*
Example:
```js
const {depositFakeInput: {tokens, tokenIds, extAmounts, pubSpendingKeys, secrets}, utxoData} = require(
    './test/assets/advancesStakingData.data.ts'
)
const [ createdAt, exitTime, vaultAddr ] = [ '0xb0bab0', '0x62626262', '0x6379dfD29D1b4bC713152F6B683223891ea118C2']
const FakePantherPoolV0 = await ethers.getContractFactory('FakePantherPoolV0')
const fakePool = await FakePantherPoolV0.deploy(vaultAddr, exitTime)
let tx = await fakePool.generateDeposits(tokens, tokenIds, extAmounts, pubSpendingKeys, secrets, createdAt)
let rcp = await tx.wait()
assert(!!rcp.logs[0].data.match(new RegExp(utxoData.replace('0x', ''))))
```
*/
