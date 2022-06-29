// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../PantherPoolV0.sol";
import "../Vault.sol";
import "../common/Types.sol";
import "./FakePrpGrantor.sol";
import "./FakeZAssetsRegistry.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// import "hardhat/console.sol";

contract MyERC20 is ERC20 {
    constructor(uint256 index, address owner)
        ERC20(Strings.toString(index), Strings.toString(index))
    {
        uint256 totalSupply = 1024;
        _mint(owner, totalSupply);
    }
    /*
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        console.logString(" --- TOKEN --- ");
        console.logString("msg.sender");
        console.log(msg.sender);
        console.logString("Spender");
        console.log(spender);
        console.logString("To");
        console.log(to);
        console.logString("From");
        console.log(from);
        _spendAllowance(from, spender, amount);
        _transfer(from, to, scaledAmount);
        return true;
    }
    */
}

contract PantherPoolV0AndVaultTester is PantherPoolV0 {
    address private registry;
    MyERC20[OUT_UTXOs] Tokens;

    constructor()
        PantherPoolV0(
            address(this),
            timeNow() + 1,
            registry = address(new FakeZAssetsRegistry()),
            address(new Vault(address(this))), // This mock is an owner of Vault
            address(new FakePrpGrantor())
        )
    {
        for (uint256 i = 0; i < OUT_UTXOs; ++i) {
            Tokens[i] = new MyERC20(i, address(this)); // This mock is an owner of MyERC20
            ZAsset memory z;
            z.tokenType = ERC20_TOKEN_TYPE;
            z.version = 0;
            z.scale = 0;
            z.token = address(Tokens[i]);
            z.status = zASSET_ENABLED;
            FakeZAssetsRegistry(registry).addZAsset(z);
        }
    }

    function getTokenAddress(uint256 index) external view returns (address) {
        return address(Tokens[index]);
    }

    function generateCommitments(
        uint256 pubSpendingKeyX,
        uint256 pubSpendingKeyY,
        uint96 scaledAmount,
        uint160 zAssetId,
        uint32 creationTime
    ) external pure returns (uint256) {
        return
            uint256(
                generateCommitment(
                    pubSpendingKeyX,
                    pubSpendingKeyY,
                    scaledAmount,
                    zAssetId,
                    creationTime
                )
            );
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

    function testExit(
        uint256 token,
        uint256 subId,
        uint96 scaledAmount,
        uint32 creationTime,
        uint256 privSpendingKey,
        uint256 leafId,
        bytes32[TREE_DEPTH + 1] calldata pathElements,
        bytes32 merkleRoot,
        uint256 cacheIndexHint
    ) external {
        this.exit(
            address(uint160(token)),
            subId,
            scaledAmount,
            creationTime,
            privSpendingKey,
            leafId,
            pathElements,
            merkleRoot,
            cacheIndexHint
        );
    }

    function approveVault(uint256 amount, uint256 index) external {
        Tokens[index].approve(VAULT, amount);
    }

    function generateDepositsExtended(
        uint256[OUT_UTXOs] calldata extAmounts,
        uint256[2] calldata pubKeys,
        uint256[CIPHERTEXT1_WORDS] calldata secrets,
        uint32 createdAt
    ) external {
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

        for (uint256 i = 0; i < OUT_UTXOs; i++) {
            this.approveVault(extAmounts[i], i);
        }

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
