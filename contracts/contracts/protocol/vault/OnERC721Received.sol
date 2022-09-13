// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
