// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

// solhint-disable no-empty-blocks
// Example of interfaces, only used with `@defi-wonderland/smock` package to mock contracts
interface IMockErc20 is IERC20 {

}

interface IMockErc721 is IERC721 {}

interface IMockErc1155 is IERC1155 {

}
// solhint-enable no-empty-blocks
