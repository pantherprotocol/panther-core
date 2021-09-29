// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import { SnarkProof } from "../Types.sol";

contract Verifier {
    function verify(SnarkProof calldata proof, uint256 inputsHash)
        internal
        returns (bool success)
    {
        return true;
    }
}
