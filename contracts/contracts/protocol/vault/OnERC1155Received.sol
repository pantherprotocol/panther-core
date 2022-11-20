// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

/// @dev Implementation of ERC1155:onERC1155Received interface
abstract contract OnERC1155Received {
    // It accepts all tokens
    function onERC1155Received(
        address, /* operator */
        address, /* from */
        uint256, /* id */
        uint256, /* value */
        bytes calldata /* data */
    ) external pure virtual returns (bytes4) {
        // bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))
        return 0xf23a6e61;
    }
}
