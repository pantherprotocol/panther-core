// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Example class, only used to demonstrate how to test contracts
// in this hardhat project.
contract BasicToken is ERC20 {
    constructor(uint256 initialBalance) ERC20("Basic", "BSC") {
        _mint(msg.sender, initialBalance);
    }
}
