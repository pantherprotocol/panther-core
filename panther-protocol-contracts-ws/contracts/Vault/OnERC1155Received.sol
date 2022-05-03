// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IOnERC1155Received {
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4);
}

/**
 * @dev Handles the receipt of a single ERC1155 token type.
 */
abstract contract OnERC1155Received is IOnERC1155Received {
    function onERC1155Received(
        address, /* operator */
        address, /* from */
        uint256, /* id */
        uint256, /* value */
        bytes calldata /* data */
    ) external pure override returns (bytes4) {
        return IOnERC1155Received.onERC1155Received.selector;
    }
}
