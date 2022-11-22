// SPDX-License-Identifier: BUSL-3.0
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.16;

/// @dev Implementation of the ERC721TokenReceiver interface
abstract contract OnERC721Received {
    // It accepts all tokens
    function onERC721Received(
        address, // operator
        address, // from
        uint256, // tokenId
        bytes memory // data
    ) external virtual returns (bytes4) {
        // bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))
        return 0x150b7a02;
    }
}
