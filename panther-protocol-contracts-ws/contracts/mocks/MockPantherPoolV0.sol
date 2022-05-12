// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../PantherPoolV0.sol";
import "../Vault.sol";

contract MockPantherPoolV0 is PantherPoolV0 {

    Vault vault;
    constructor() PantherPoolV0(msg.sender,0,address(vault)) public {

    }
    function GenerateDepositsExtended(
        uint256[OUT_UTXOs] calldata tokens,
        uint256[OUT_UTXOs] calldata extAmounts,
        uint256[2] calldata pubKeys,
        uint256[CIPHERTEXT1_WORDS] calldata secrets
//uint256[2][OUT_UTXOs] calldata pubKeys,
//uint256[CIPHERTEXT1_WORDS][OUT_UTXOs] calldata secrets
) external {

        address[OUT_UTXOs] memory tokenss;
        tokenss[0] = address(uint160(tokens[0]));
        tokenss[1] = address(uint160(tokens[1]));
        tokenss[2] = address(uint160(tokens[2]));

        uint256[OUT_UTXOs] memory tokenIds;
        tokenIds[0] = 0;
        tokenIds[1] = 0;
        tokenIds[2] = 0;

        G1Point[OUT_UTXOs] memory pubKeyss;
        pubKeyss[0] = G1Point(pubKeys[0],pubKeys[1]);
        pubKeyss[1] = G1Point(pubKeys[0],pubKeys[1]);
        pubKeyss[2] = G1Point(pubKeys[0],pubKeys[1]);
        //pubKeyss[1] = G1Point(pubKeys[1][0],pubKeys[1][1]);
        //pubKeyss[2] = G1Point(pubKeys[2][0],pubKeys[2][1]);

        uint256[CIPHERTEXT1_WORDS][OUT_UTXOs] memory secretss;
        secretss[0][0] = secrets[0];
        secretss[0][1] = secrets[1];
        secretss[0][2] = secrets[2];
        secretss[1][0] = secrets[0];
        secretss[1][1] = secrets[1];
        secretss[1][2] = secrets[2];
        secretss[2][0] = secrets[0];
        secretss[2][1] = secrets[1];
        secretss[2][2] = secrets[2];

        uint256 creationTime = 0;

        this.generateDeposits(tokenss,tokenIds,extAmounts,pubKeyss,secretss, creationTime);
    }

    function GenerateDeposits() external {

        address[OUT_UTXOs] memory tokens;
        tokens[0] = address(1);
        tokens[1] = address(2);
        tokens[2] = address(3);

        uint256[OUT_UTXOs] memory tokenIds;
        tokenIds[0] = 1;
        tokenIds[1] = 2;
        tokenIds[2] = 3;

        uint256[OUT_UTXOs] memory extAmounts;
        extAmounts[0] = 1;
        extAmounts[1] = 2;
        extAmounts[2] = 3;

        G1Point[OUT_UTXOs] memory pubKeys;
        pubKeys[0] = G1Point(0,0);
        pubKeys[1] = G1Point(1,1);
        pubKeys[2] = G1Point(2,2);

        uint256[CIPHERTEXT1_WORDS][OUT_UTXOs] memory secrets;
        secrets[0][0] = 0;
        secrets[0][1] = 0;
        secrets[0][2] = 0;
        secrets[1][0] = 0;
        secrets[1][1] = 0;
        secrets[1][2] = 0;
        secrets[2][0] = 0;
        secrets[2][1] = 0;
        secrets[2][2] = 0;

        uint256 creationTime = 0;

        this.generateDeposits(tokens,tokenIds,extAmounts,pubKeys,secrets,creationTime);
    }
}
