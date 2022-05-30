// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import { SnarkProof } from "../common/Types.sol";

// FIXME: this is currently used; see TODO in Verifier.sol.

interface IVerifier {
    function verifyProof(SnarkProof calldata proof, uint256 inputsHash)
        external
        pure
        returns (bool);
}
