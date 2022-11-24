// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

/**
 * @title ContextMixin contract
 * @dev ContextMixin (via Meta-transactions) enables gasless user transactions.
 * This contract is supposed to run on Polygon and grant one
 * Based on the https://github.com/ProjectOpenSea/opensea-creatures/blob/master/
 * contracts/common/meta-transactions/ContentMixin.sol
 */
abstract contract ContextMixin {
    function msgSender() internal view returns (address payable sender) {
        if (msg.sender == address(this)) {
            bytes memory array = msg.data;
            uint256 index = msg.data.length;
            // solhint-disable-next-line no-inline-assembly
            assembly {
                // Load the 32 bytes word from memory with the address on the lower 20 bytes, and mask those.
                sender := and(
                    mload(add(array, index)),
                    0xffffffffffffffffffffffffffffffffffffffff
                )
            }
        } else {
            sender = payable(msg.sender);
        }
        return sender;
    }
}
