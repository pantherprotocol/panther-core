// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
// slither-disable-next-line solc-version
pragma solidity ^0.8.0;

abstract contract Utils {
    // false positive
    // slither-disable-next-line timestamp
    function safe32(uint256 n) internal pure returns (uint32) {
        require(n < 2**32, "UNSAFE32");
        return uint32(n);
    }

    function safe96(uint256 n) internal pure returns (uint96) {
        require(n < 2**96, "UNSAFE96");
        return uint96(n);
    }

    // disabled since false positive
    // slither-disable-next-line dead-code
    function safe128(uint256 n) internal pure returns (uint128) {
        require(n < 2**128, "UNSAFE128");
        return uint128(n);
    }

    // disabled since false positive
    // slither-disable-next-line dead-code
    function safe160(uint256 n) internal pure returns (uint160) {
        require(n < 2**160, "UNSAFE160");
        return uint160(n);
    }

    function safe32TimeNow() internal view returns (uint32) {
        return safe32(timeNow());
    }

    // disabled since false positive
    // slither-disable-next-line dead-code
    function safe32BlockNow() internal view returns (uint32) {
        return safe32(blockNow());
    }

    /// @dev Returns the current block timestamp (added to ease testing)
    function timeNow() internal view virtual returns (uint256) {
        return block.timestamp;
    }

    /// @dev Returns the current block number (added to ease testing)
    // disabled since false positive
    // slither-disable-next-line dead-code
    function blockNow() internal view virtual returns (uint256) {
        return block.number;
    }

    // disabled since false positive
    // slither-disable-next-line dead-code
    function revertZeroAddress(address account) internal pure {
        require(account != address(0), "UNEXPECTED_ZERO_ADDRESS");
    }
}
