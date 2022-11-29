// SPDX-License-Identifier: MIT
// solhint-disable-next-line max-line-length
// Source: https://github.com/ProjectOpenSea/opensea-creatures/blob/master/contracts/common/meta-transactions/ContentMixin.sol

pragma solidity ^0.8.16;

/**
 * @title ContextMixin contract
 * @dev It supports gasless user transactions
 */
abstract contract ContextMixin {
    function msgSender() internal view returns (address payable sender) {
        if (msg.sender == address(this)) {
            bytes memory array = msg.data;
            uint256 index = msg.data.length;
            // solhint-disable no-inline-assembly
            // slither-disable-next-line assembly
            assembly {
                // Load the 32 bytes word from memory with the address on the lower 20 bytes, and mask those.
                sender := and(
                    mload(add(array, index)),
                    0xffffffffffffffffffffffffffffffffffffffff
                )
            }
            // solhint-enable no-inline-assembly
        } else {
            sender = payable(msg.sender);
        }
        return sender;
    }
}
