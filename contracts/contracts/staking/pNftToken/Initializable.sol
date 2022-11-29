// SPDX-License-Identifier: MIT
// solhint-disable-next-line max-line-length
// Source: https://github.com/ProjectOpenSea/opensea-creatures/blob/master/contracts/common/meta-transactions/Initializable.sol

pragma solidity ^0.8.16;

/**
 * @title Initializable contract
 */
contract Initializable {
    bool private inited = false;

    modifier initializer() {
        require(!inited, "already inited");
        _;
        inited = true;
    }
}
