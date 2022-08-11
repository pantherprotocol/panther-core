// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface INftGrantor {
    function grantOneToken(address to) external returns (uint256 tokenId);
}
