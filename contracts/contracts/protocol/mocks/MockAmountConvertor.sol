// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../pantherPool/AmountConvertor.sol";

contract MockAmountConvertor is AmountConvertor {
    function internalScaleAmount(uint256 amount, uint8 scale)
        external
        pure
        returns (uint96 scaledAmount, uint256 change)
    {
        return _scaleAmount(amount, scale);
    }

    function internalUnscaleAmount(uint96 scaledAmount, uint8 scale)
        external
        pure
        returns (uint96)
    {
        return _unscaleAmount(scaledAmount, scale);
    }
}
