// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IErc20Min {

    /// ERC-20 `transfer`
    function transfer(address recipient, uint256 amount) external returns (bool);

    /// ERC-20 `transferFrom`
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /// @dev EIP-2612 `permit`
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}
