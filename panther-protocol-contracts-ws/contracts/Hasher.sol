// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import {PoseidonT3} from "./Poseidon.sol";

import {SnarkConstants} from "./SnarkConstants.sol";

/*
 * Poseidon hash functions for 2, 5, and 11 input elements.
 */
contract Hasher is SnarkConstants {
    function hashLeftRight(uint256 _left, uint256 _right)
        public
        pure
        returns (uint256)
    {
        uint256[2] memory input;
        input[0] = _left;
        input[1] = _right;
        return PoseidonT3.poseidon(input);
    }
}
