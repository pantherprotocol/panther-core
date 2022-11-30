// SPDX-License-Identifier: MIT
// slither-disable-next-line solc-version
pragma solidity ^0.8.4;

import "../../common/Claimable.sol";

contract MockClaimable is Claimable {
    function internalClaimErc20(
        address token,
        address to,
        uint256 amount
    ) external {
        _claimErc20(token, to, amount);
    }
}
