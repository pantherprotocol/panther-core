// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../PantherPoolV0.sol";
import "./FakeVault.sol";
import "./FakePrpGrantor.sol";
import "./MockPantherPoolV0.sol";
import "../ZAssetsRegistry.sol";

contract PantherPoolV0AndZAssetRegistryTester is MockPantherPoolV0 {
    address private registry;

    constructor()
        MockPantherPoolV0(
            address(this),
            // This mock is the owner of ZAssetsRegistry
            registry = address(new ZAssetsRegistry(address(this))),
            address(new FakeVault()),
            address(new FakePrpGrantor())
        )
    {
        ZAsset memory z1;
        z1.tokenType = ERC20_TOKEN_TYPE;
        z1.version = 0;
        z1.scale = 0;
        z1.token = address(uint160(111));
        z1.status = zASSET_ENABLED;
        ZAssetsRegistry(registry).addZAsset(z1);

        exitTime = safe32TimeNow() + 1;
    }

    function testConvert(uint256 n) external pure returns (bytes32) {
        return bytes32(n);
    }

    function testGenerateDepositsExtended(
        address[OUT_UTXOs] calldata tokens,
        uint256[OUT_UTXOs] calldata extAmounts,
        uint256[2] calldata pubKeys,
        uint256[CIPHERTEXT1_WORDS] calldata secrets,
        uint32 createdAt
    ) external {
        address[OUT_UTXOs] memory tokenss;
        tokenss[0] = tokens[0];
        tokenss[1] = tokens[1];
        tokenss[2] = tokens[2];

        uint256[OUT_UTXOs] memory subIds;
        subIds[0] = 0;
        subIds[1] = 0;
        subIds[2] = 0;

        G1Point[OUT_UTXOs] memory pubKeyss;
        pubKeyss[0] = G1Point(pubKeys[0], pubKeys[1]);
        pubKeyss[1] = G1Point(pubKeys[0], pubKeys[1]);
        pubKeyss[2] = G1Point(pubKeys[0], pubKeys[1]);

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

        this.generateDeposits(
            tokens,
            subIds,
            extAmounts,
            pubKeyss,
            secretss,
            createdAt
        );
    }
}
