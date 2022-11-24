// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.16;

import "../PantherPoolV0.sol";
import "../Vault.sol";
import "../../common/Types.sol";
import "./MockPantherPoolV0.sol";
import "../ZAssetsRegistry.sol";
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

// solhint-disable var-name-mixedcase
contract PantherPoolV0AndZAssetRegistryAndVaultTester is MockPantherPoolV0 {
    address private registry;
    MyERC20[OUT_UTXOs] private Tokens;

    constructor()
        MockPantherPoolV0(
            address(this),
            // This mock is the owner of ZAssetsRegistry and Vault
            registry = address(new ZAssetsRegistry(address(this))),
            address(new Vault(address(this)))
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
            ZAssetsRegistry(registry).addZAsset(z);
        }
        exitTime = safe32TimeNow() + 1;
    }

    function testGetZAssetId(uint256 token, uint256 tokenId)
        external
        view
        returns (uint160)
    {
        return
            ZAssetsRegistry(registry).getZAssetId(
                address(uint160(token)),
                tokenId
            );
    }

    function getTokenAddress(uint256 index) external view returns (address) {
        return address(Tokens[index]);
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
        secretss[1][0] = secrets[0];
        secretss[1][1] = secrets[1];
        secretss[2][0] = secrets[0];
        secretss[2][1] = secrets[1];

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
