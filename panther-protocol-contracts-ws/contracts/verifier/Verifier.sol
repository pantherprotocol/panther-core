// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import { SnarkProof } from "../Types.sol";
import "../interfaces/IVerifier.sol";

// TODO: Do we want PantherPool to inherit from this, or is there any value
// in making it an external contract, e.g. for easier upgrades?
contract Verifier {
    function verifyProof(
        SnarkProof calldata, // proof,
        uint256 inputsHash
    ) internal pure returns (bool success) {
        return inputsHash > 0; // FIXME!
    }
}
