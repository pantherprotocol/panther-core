// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import { NonReentrant } from "../common/NonReentrant.sol";
import { LockData } from "../common/Types.sol";
import "../common/ErrorMsgs.sol";
import "../common/Constants.sol";
import "../common/ImmutableOwnable.sol";
import "../common/TransferHelper.sol";
import "./OnERC1155Received.sol";
import "../interfaces/IVault.sol";

/**
 * @title Vault
 * @author Pantherprotocol Contributors
 * @notice Holder of assets (tokens) for `PantherPool` contract
 * @dev the contract is expected to transfer asset from user to
 * itself(Lock) and vice versa(Unlock). it uses
 * TransferHelper library to interact with tokens.
 */
contract Vault is IVault, OnERC1155Received, NonReentrant, ImmutableOwnable {
    using TransferHelper for address;

    constructor(address _owner) ImmutableOwnable(_owner) {} // solhint-disable-line no-empty-blocks

    function lockAsset(LockData calldata data)
        external
        override
        onlyOwner
        checkLockData(data)
    {
        if (data.tokenType == ERC20_TOKEN_TYPE) {
            data.token.safeTransferFrom(
                data.extAccount,
                address(this),
                data.extAmount
            );
        } else if (data.tokenType == ERC721_TOKEN_TYPE) {
            data.token.safeTransferFrom(
                data.tokenId,
                data.extAccount,
                address(this)
            );
        } else if (data.tokenType == ERC1155_TOKEN_TYPE) {
            data.token.safeTransferFrom(
                data.extAccount,
                address(this),
                data.tokenId,
                data.extAmount
            );
        } else {
            revert(INVALID_LOCK_TOKEN_TYPE);
        }

        emit Locked(data);
    }

    function unlockAsset(LockData calldata data)
        external
        override
        nonReentrant
        onlyOwner
        checkLockData(data)
    {
        if (data.tokenType == ERC20_TOKEN_TYPE) {
            data.token.safeTransfer(data.extAccount, data.extAmount);
        } else if (data.tokenType == ERC721_TOKEN_TYPE) {
            data.token.safeTransferFrom(
                data.tokenId,
                address(this),
                data.extAccount
            );
        } else if (data.tokenType == ERC1155_TOKEN_TYPE) {
            data.token.safeTransferFrom(
                address(this),
                data.extAccount,
                data.tokenId,
                data.extAmount
            );
        } else {
            revert(INVALID_LOCK_TOKEN_TYPE);
        }

        emit Unlocked(data);
    }

    modifier checkLockData(LockData calldata data) {
        require(data.token != address(0), ERR_ZERO_LOCK_TOKEN_ADDR);
        require(data.extAccount != address(0), ERR_ZERO_EXT_ACCOUNT_ADDR);
        require(data.extAmount > 0, ERR_ZERO_EXT_AMOUNT);
        _;
    }

    // NOTE: The contract is supposed to run behind a proxy DELEGATECALLing it.
    // For compatibility on upgrades, decrease `__gap` if new variables added.
    uint256[50] private __gap;
}
