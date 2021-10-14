// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { SnarkProof } from "../Types.sol";

// FIXME: this is currently used; see TODO in Verifier.sol.

interface IVerifier {
    function verifyProof(SnarkProof calldata proof, uint256 inputsHash)
        external
        pure
        returns (bool);
}
