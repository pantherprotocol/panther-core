// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import "../actions/AdvancedStakingDataDecoder.sol";
import "../../common/Constants.sol";

contract MockAdvancedStakingDataDecoder is AdvancedStakingDataDecoder {
    function internalUnpackStakingData(bytes memory data)
        external
        pure
        returns (
            G1Point[OUT_RWRD_UTXOs] memory pubSpendingKeys,
            uint256[CIPHERTEXT1_WORDS][OUT_RWRD_UTXOs] memory secrets
        )
    {
        return unpackStakingData(data);
    }
}
