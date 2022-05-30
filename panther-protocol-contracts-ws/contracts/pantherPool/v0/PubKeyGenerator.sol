// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import { G1Point } from "../../common/Types.sol";
import { ERR_TOO_LARGE_PRIVKEY } from "../../common/ErrorMsgs.sol";
import { FIELD_SIZE } from "../../crypto/SnarkConstants.sol";
import "../../crypto/BabyJubJub.sol";

abstract contract PubKeyGenerator {
    function generatePubSpendingKey(uint256 privKey)
        internal
        view
        returns (G1Point memory pubKey)
    {
        // [0] - Require
        require(privKey < FIELD_SIZE, ERR_TOO_LARGE_PRIVKEY);
        // [1] - Generate public key
        G1Point memory base8 = G1Point({
            x: BabyJubJub.BASE8_X,
            y: BabyJubJub.BASE8_Y
        });
        pubKey = BabyJubJub.mulPointEscalar(base8, privKey);
    }
}
