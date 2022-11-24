// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

/**
 * @title Initializable contract
 * @dev Based on the https://github.com/ProjectOpenSea/opensea-creatures/blob/master/
 * contracts/common/meta-transactions/Initializable.sol
 */
contract Initializable {
    bool private inited = false;

    modifier initializer() {
        require(!inited, "already inited");
        _;
        inited = true;
    }
}
