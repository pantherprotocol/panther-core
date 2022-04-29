// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { G1Point } from "../../common/Types.sol";
import { ERR_TOO_LARGE_PRIVKEY } from "../../common/ErrorMsgs.sol";
import { FIELD_SIZE } from "../../crypto/SnarkConstants.sol";

abstract contract PubKeyGenerator {
    function generatePubSpendingKey(uint256 privKey)
        internal
        pure
        returns (G1Point memory pubKey)
    {
        require(privKey < FIELD_SIZE, ERR_TOO_LARGE_PRIVKEY);

        // TODO: compute pub key
        pubKey = G1Point(0, 0);
    }
}
