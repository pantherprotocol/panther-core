// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import { ERR_INVALID_PUBKEYS } from "./common/ErrorMsgs.sol";

contract Register {
    event PublicKeys(address indexed owner, bytes keys, uint256 expiryTime);

    function registerPubKeys(bytes calldata pubKeys, uint256 expiryTime)
        external
    {
        require(isWellformedPubKeys(pubKeys), ERR_INVALID_PUBKEYS);
        require(isValidExpiry(expiryTime), ERR_INVALID_PUBKEYS);
        emit PublicKeys(msg.sender, pubKeys, expiryTime);
    }

    function isWellformedPubKeys(bytes calldata _pubKeys)
        internal
        pure
        virtual
        returns (bool)
    {
        // 64-bytes pub reading key and 64-bytes root spending pub key expected
        return _pubKeys.length == 4;
    }

    function isValidExpiry(uint256 expiry)
        internal
        pure
        virtual
        returns (bool)
    {
        return expiry != 0;
    }
}
