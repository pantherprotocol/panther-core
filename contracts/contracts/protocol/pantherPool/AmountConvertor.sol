// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import { MAX_EXT_AMOUNT, MAX_IN_CIRCUIT_AMOUNT } from "../common/Constants.sol";
import { ERR_TOO_LARGE_AMOUNT, ERR_TOO_LARGE_SCALED_AMOUNT } from "../errMsgs/PantherPoolErrMsgs.sol";

/**
 * @title AmountConvertor
 * @author Pantherprotocol Contributors
 * @notice Methods for scaling amounts for computations within/outside the
 * Panther Protocol Multi-Asset Shielded Pool (aka "MASP")
 */
abstract contract AmountConvertor {
    // "Scaled amounts" - amounts ZK-circuits of the MASP operate with
    // "Unscaled amounts" - amounts token contracts operate with
    // Scaling is relevant for fungible tokens only - for ERC-721/ERC-1155
    // tokens, scaled and unscaled amounts MUST be equal. For some ERC-20
    // tokens, the "scaling factor" MAY be 1:1, i.e. scaled and unscaled
    // amounts are equal.

    // Conversion from the unscaled amount (aka amount) to the scaled one.
    // Returns the scaled amount and the reminder.
    function _scaleAmount(uint256 amount, uint8 scale)
        internal
        pure
        returns (uint96 scaledAmount, uint256 change)
    {
        uint256 _scaledAmount;
        if (scale == 0) {
            // No scaling and no change for zero `scale`
            _scaledAmount = amount;
            change = 0;
        } else {
            unchecked {
                uint256 factor = _getScalingFactor(scale);
                // divider can't be zero
                _scaledAmount = amount / factor;
                // `restoredAmount` can not exceed the `amount`
                uint256 restoredAmount = _scaledAmount * factor;
                change = amount - restoredAmount;
            }
        }
        scaledAmount = _sanitizeScaledAmount(_scaledAmount);
    }

    // Conversion from the scaled amount to unscaled one.
    // Returns the unscaled amount.
    function _unscaleAmount(uint96 scaledAmount, uint8 scale)
        internal
        pure
        returns (uint96)
    {
        uint256 amount = scale == 0
            ? scaledAmount // no scaling
            : uint256(scaledAmount) * _getScalingFactor(scale);
        return _sanitizeAmount(amount);
    }

    function _sanitizeAmount(uint256 amount) internal pure returns (uint96) {
        require(amount < MAX_EXT_AMOUNT, ERR_TOO_LARGE_AMOUNT);
        return uint96(amount);
    }

    function _sanitizeScaledAmount(uint256 scaledAmount)
        internal
        pure
        returns (uint96)
    {
        require(
            scaledAmount < MAX_IN_CIRCUIT_AMOUNT,
            ERR_TOO_LARGE_SCALED_AMOUNT
        );
        return uint96(scaledAmount);
    }

    /// Private functions follow

    // Note: implementation accepts 0..255 values for nonZeroScale
    // It is responsibility of the caller check it is indeed less than 255 since 10^255 overflows uint256
    // This overflow check not implemented here since caller will implement it in upper level
    function _getScalingFactor(uint8 nonZeroScale)
        private
        pure
        returns (uint256)
    {
        return 10**nonZeroScale;
    }
}
