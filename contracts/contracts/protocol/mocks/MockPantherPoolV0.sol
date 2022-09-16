// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../PantherPoolV0.sol";

// solhint-disable var-name-mixedcase
// solhint-disable no-empty-blocks
// solhint-disable func-name-mixedcase
// solhint-disable event-name-camelcase
contract MockPantherPoolV0 is PantherPoolV0 {
    constructor(
        address _owner,
        address assetRegistry,
        address vault,
        address prpGrantor
    ) PantherPoolV0(_owner, assetRegistry, vault, prpGrantor) {}

    event RESULT_processDepositedAsset(uint160 zAssetId, uint96 scaledAmount);

    function internalProcessDepositedAsset(
        address token,
        uint256 subId,
        uint256 extAmount
    ) external {
        (uint160 zAssetId, uint96 scaledAmount) = _processDepositedAsset(
            token,
            subId,
            extAmount
        );
        emit RESULT_processDepositedAsset(zAssetId, scaledAmount);
    }

    function testGeneratePublicSpendingKey(uint256 privKey)
        external
        view
        returns (uint256[2] memory xy)
    {
        G1Point memory p;
        p = generatePubSpendingKey(privKey);
        xy[0] = p.x;
        xy[1] = p.y;
    }

    function testUpdateExitTimes(uint32 newExitTime, uint24 newExitDelay)
        external
    {
        this.updateExitTimes(newExitTime, newExitDelay);
    }

    function testExit(
        address token,
        uint256 subId,
        uint64 scaledAmount,
        uint32 creationTime,
        uint256 privSpendingKey,
        uint256 leafId,
        bytes32[TREE_DEPTH + 1] calldata pathElements,
        bytes32 merkleRoot,
        uint256 cacheIndexHint
    ) external {
        this.exit(
            token,
            subId,
            scaledAmount,
            creationTime,
            privSpendingKey,
            leafId,
            pathElements,
            merkleRoot,
            cacheIndexHint
        );
    }

    function testGenerateCommitments(
        uint256 pubSpendingKeyX,
        uint256 pubSpendingKeyY,
        uint64 scaledAmount,
        uint160 zAssetId,
        uint32 creationTime
    ) external pure returns (uint256) {
        return
            uint256(
                generateCommitment(
                    pubSpendingKeyX,
                    pubSpendingKeyY,
                    scaledAmount,
                    zAssetId,
                    creationTime
                )
            );
    }
}
