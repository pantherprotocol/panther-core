// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import { LockData } from "./common/Types.sol";
import "./interfaces/IVault.sol";

/**
 * @title Vault
 * @author Pantherprotocol Contributors
 * @notice Holder of assets (tokens) for `PantherPool` contract
 */
contract Vault is IVault {
    event DEBUG(LockData data);

    function lockAsset(LockData calldata data) external override {
        // TODO: implement lockAsset
        emit DEBUG(data);
    }

    function unlockAsset(LockData memory data) external override {
        // TODO: implement unlockAsset
        emit DEBUG(data);
    }

    // NOTE: The contract is supposed to run behind a proxy DELEGATECALLing it.
    // For compatibility on upgrades, decrease `__gap` if new variables added.
    uint256[50] private __gap;
}
