// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.16;

import { PoseidonT3 } from "../crypto/Poseidon.sol";
import { FIELD_SIZE } from "../crypto/SnarkConstants.sol";
import { ERR_TOO_LARGE_LEAFID, ERR_TOO_LARGE_PRIVKEY } from "../errMsgs/PantherPoolErrMsgs.sol";

abstract contract NullifierGenerator {
    function generateNullifier(uint256 privSpendingKey, uint256 leafId)
        internal
        pure
        returns (bytes32 nullifier)
    {
        require(privSpendingKey < FIELD_SIZE, ERR_TOO_LARGE_PRIVKEY);
        require(leafId < FIELD_SIZE, ERR_TOO_LARGE_LEAFID);
        nullifier = PoseidonT3.poseidon(
            [bytes32(privSpendingKey), bytes32(leafId)]
        );
    }
}
