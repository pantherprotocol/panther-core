// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.16;

import { G1Point } from "../../common/Types.sol";
import "../pantherPool/PubKeyGenerator.sol";

contract MockPubKeyGenerator is PubKeyGenerator {
    function internalGeneratePubSpendingKey(uint256 privKey)
        external
        view
        returns (G1Point memory pubKey)
    {
        return generatePubSpendingKey(privKey);
    }
}
