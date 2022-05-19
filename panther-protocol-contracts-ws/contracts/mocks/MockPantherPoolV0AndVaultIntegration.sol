// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../PantherPoolV0.sol";
import "../Vault.sol";
import "../common/Types.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract MyERC20 is ERC20 {
    constructor(uint256 index, address owner)
        ERC20(Strings.toString(index), Strings.toString(index))
    {
        uint256 totalSupply = 1024;
        _mint(owner, totalSupply);
    }
}

contract MockPantherPoolV0AndVaultIntegration is PantherPoolV0 {
    Vault vault;

    address _owner;

    MyERC20[OUT_UTXOs] Tokens;

    constructor()
        PantherPoolV0(
            address(this),
            timeNow() + 1,
            address(vault = new Vault(address(this)))
        )
    {
        _owner = msg.sender;
        for (uint256 i = 0; i < OUT_UTXOs; ++i) {
            Tokens[i] = new MyERC20(i, address(this));
            ZAsset memory z;
            z.tokenType = ERC20_TOKEN_TYPE;
            z.scale = 0;
            z.token = address(Tokens[i]);
            z.status = zASSET_ENABLED;
            addAsset(z);
        }
    }

    function getTokenAddress(uint256 index) external view returns (address) {
        return address(Tokens[index]);
    }

    function getZAssetId(uint256 token, uint256 tokenId)
        external
        pure
        returns (uint256)
    {
        return getZAssetId(address(uint160(token)), tokenId);
    }

    function isKnownZAsset(uint256 token, uint256 tokenId)
        external
        view
        returns (bool)
    {
        ZAsset memory asset;
        uint160 zAssetId;
        (asset, zAssetId) = getZAssetAndId(address(uint160(token)), tokenId);
        if (asset.status == 1 || asset.status == 2) {
            return true;
        }
        return false;
    }

    function generateCommitments(
        uint256 pubSpendingKeyX,
        uint256 pubSpendingKeyY,
        uint256 amount,
        uint256 zAssetId,
        uint256 creationTime
    ) external pure returns (uint256) {
        return
            uint256(
                generateCommitment(
                    pubSpendingKeyX,
                    pubSpendingKeyY,
                    amount,
                    zAssetId,
                    creationTime
                )
            );
    }

    function convert(uint256 n) external pure returns (bytes32) {
        return bytes32(n);
    }

    function generatePublicSpendingKey(uint256 privKey)
        external
        view
        returns (uint256[2] memory xy)
    {
        G1Point memory p;
        p = generatePubSpendingKey(privKey);
        xy[0] = p.x;
        xy[1] = p.y;
    }

    function exit(
        uint256 token,
        uint256 tokenId,
        uint256 amount,
        uint256 creationTime,
        uint256 privSpendingKey,
        uint256 leafId,
        bytes32[TREE_DEPTH + 1] calldata pathElements,
        bytes32 merkleRoot,
        uint256 cacheIndexHint
    ) external {
        this.exit(
            address(uint160(token)),
            tokenId,
            amount,
            creationTime,
            privSpendingKey,
            leafId,
            pathElements,
            merkleRoot,
            cacheIndexHint
        );
    }

    function generateDepositsExtended(
        uint256[OUT_UTXOs] calldata extAmounts,
        uint256[2] calldata pubKeys,
        uint256[CIPHERTEXT1_WORDS] calldata secrets,
        uint256 createdAt
    ) external {
        require(_owner == msg.sender, "OWNER IS NOT MESSAGE_SENDER");

        uint256[OUT_UTXOs] memory tokenIds;
        tokenIds[0] = 0;
        tokenIds[1] = 0;
        tokenIds[2] = 0;

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
            [address(Tokens[0]), address(Tokens[1]), address(Tokens[2])],
            tokenIds,
            extAmounts,
            pubKeyss,
            secretss,
            createdAt
        );
    }
}
