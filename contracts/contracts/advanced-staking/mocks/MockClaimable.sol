// SPDX-License-Identifier: UNLICENSED
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "../utils/Claimable.sol";

contract MockClaimable is Claimable {
    function internalClaimErc20(
        address token,
        address to,
        uint256 amount
    ) external {
        _claimErc20(token, to, amount);
    }
}
