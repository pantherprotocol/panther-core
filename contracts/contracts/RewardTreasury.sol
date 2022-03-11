// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// solhint-disable var-name-mixedcase
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "./interfaces/IErc20Min.sol";
import "./utils/ImmutableOwnable.sol";
import "./utils/Claimable.sol";
import "./utils/NonReentrant.sol";

interface IErc20Approve {
    /// @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
    // Beware of risk: https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    function approve(address spender, uint256 amount) external returns (bool);
}

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

    /// @notece It sets amounts as ERC20 allowances over the {token} to specified spenders
    /// @dev May be only called by the {OWNER}
    function batchApprove(address[] spenders, uint256[] amounts)
        external
        onlyOwner
    {
        require(spenders.length == amounts.length, "RT: unmatched length");
        for (uint256 i = 0; i < spenders.length; i++) {
            // call to the trusted contract - no reentrancy guard needed
            IErc20Approve(token).approve(spenders[i], amounts[i]);
        }
    }

    /// @notice Withdraws accidentally sent token from this contract
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
