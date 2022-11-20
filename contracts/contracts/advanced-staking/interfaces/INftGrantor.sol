// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

interface INftGrantor {
    function grantOneToken(address to) external returns (uint256 tokenId);
}
