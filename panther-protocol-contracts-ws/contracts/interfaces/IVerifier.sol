// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IVerifier {
    function verifyProof(bytes memory _proof, uint256[10] memory _input)
        external
        view
        returns (bool);

    function verifyProof(bytes memory _proof, uint256[24] memory _input)
        external
        view
        returns (bool);
}
