// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @dev Interface to call ERC-20 `approve` function
interface IErc20Approve {
    /// @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
    // Beware of risk: https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    function approve(address spender, uint256 amount) external returns (bool);
}
