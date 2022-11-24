// SPDX-License-Identifier: BUSL-3.0
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// solhint-disable var-name-mixedcase
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
// slither-disable-next-line solc-version
pragma solidity 0.8.4;

import "./interfaces/IErc20Min.sol";
import "./interfaces/IErc20Approve.sol";
import "../common/ImmutableOwnable.sol";
import "../common/Claimable.sol";
import "../common/NonReentrant.sol";

/**
 * @title RewardTreasury
 * @notice It keeps tokens of the "Reward Pool" and let authorized contracts spend them.
 * @dev The Owner may alter ERC20 allowances and withdraw accidentally sent tokens.
 */
contract RewardTreasury is ImmutableOwnable, NonReentrant, Claimable {
    /// @notice Address of the Reward Pool token
    address public immutable token;

    constructor(address _owner, address _token) ImmutableOwnable(_owner) {
        require(_token != address(0), "RT: E1");
        token = _token;
    }

    /// @notice It sets amount as ERC20 allowance over the {token} to the given spender
    /// @dev May be only called by the {OWNER}
    function approveSpender(address spender, uint256 amount)
        external
        onlyOwner
    {
        // call to the trusted contract - no reentrancy guard needed
        // slither-disable-next-line unused-return
        IErc20Approve(token).approve(spender, amount);
    }

    /// @notice Withdraws accidentally sent tokens from this contract
    /// @dev May be only called by the {OWNER}
    function claimErc20(
        address claimedToken,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(claimedToken != token, "RT: prohibited");
        _claimErc20(claimedToken, to, amount);
    }
}
