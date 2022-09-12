// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

interface IRootsHistory {
    /// @notice Returns `true` if the given root of the given tree is known
    /// @param cacheIndexHint Index of the root in the cache, ignored if 0
    function isKnownRoot(
        uint256 treeId,
        bytes32 root,
        uint256 cacheIndexHint
    ) external view returns (bool);
}
