// SPDX-License-Identifier: BUSL-3.0
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// slither-disable-next-line solc-version
pragma solidity 0.8.4;

import "./interfaces/IErc20Min.sol";
import "./interfaces/IRewardPool.sol";
import "../common/Claimable.sol";
import "../common/ImmutableOwnable.sol";
import "../common/Utils.sol";
import "../common/NonReentrant.sol";

/**
 * @title MaticRewardPool
 * @notice It vests $ZKP token from its balance gradually over time.
 * @dev This contract is supposed to release $ZKP to the `RewardMaster` on Matic.
 * Tokens to vest will be bridged from the mainnet to Matic (maybe, a few times).
 */
contract MaticRewardPool is
    ImmutableOwnable,
    NonReentrant,
    Claimable,
    IRewardPool,
    Utils
{
    /// @notice Address of the token vested ($ZKP)
    IErc20Min public immutable token;

    /// @notice Address to vest tokens to
    address public recipient;

    /// @notice (UNIX) Timestamp when vesting starts
    uint32 public startTime;
    /// @notice (UNIX) Timestamp when vesting ends
    uint32 public endTime;

    constructor(address _token, address _owner)
        ImmutableOwnable(_owner)
        nonZeroAddress(_token)
    {
        token = IErc20Min(_token);
    }

    /// @inheritdoc IRewardPool
    function releasableAmount() external view override returns (uint256) {
        if (recipient == address(0)) return 0;

        return _releasableAmount();
    }

    /// @inheritdoc IRewardPool
    function vestRewards() external override returns (uint256 amount) {
        // revert if unauthorized or recipient not yet set
        require(msg.sender == recipient, "RP: unauthorized");

        amount = _releasableAmount();

        // false positive
        // slither-disable-next-line timestamp
        if (amount != 0) {
            // trusted contract - no reentrancy guard needed
            // slither-disable-next-line unchecked-transfer,reentrancy-events
            token.transfer(recipient, amount);
            emit Vested(amount);
        }
    }

    /// @notice Sets the {recipient}, {startTime} and {endTime} to given values
    /// @dev Owner only may call, once only
    function initialize(
        address _recipient,
        uint32 _startTime,
        uint32 _endTime
    ) external onlyOwner nonZeroAddress(_recipient) {
        // once only
        require(recipient == address(0), "RP: initialized");
        // _endTime can't be in the past
        // Time comparison is acceptable in this case since block time accuracy is enough for this scenario
        // slither-disable-next-line timestamp
        require(_endTime > timeNow(), "RP: I2");
        require(_endTime > _startTime, "RP: I3");

        recipient = _recipient;
        startTime = _startTime;
        endTime = _endTime;

        emit Initialized(0, _recipient, _endTime);
    }

    /// @notice Withdraws accidentally sent token from this contract
    /// @dev May be only called by the {OWNER}
    function claimErc20(
        address claimedToken,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        if (claimedToken == address(token)) {
            // Time comparison is acceptable in this case since block time accuracy is enough for this scenario
            // slither-disable-next-line timestamp
            require(timeNow() > endTime, "RP: prohibited");
        }
        _claimErc20(claimedToken, to, amount);
    }

    function _releasableAmount() internal view returns (uint256) {
        uint256 _timeNow = timeNow();

        // Time comparison is acceptable in this case since block time accuracy is enough for this scenario
        // slither-disable-next-line timestamp
        if (startTime > _timeNow) return 0;

        // trusted contract - no reentrancy guard needed
        uint256 balance = token.balanceOf(address(this));
        // Time comparison is acceptable in this case since block time accuracy is enough for this scenario
        // slither-disable-next-line timestamp
        if (_timeNow >= endTime) return balance;

        // @dev Next line has a bug (it ignores already released amounts).
        // The buggy line left unchanged here as it is at:
        // matic:0x773d49309c4E9fc2e9254E7250F157D99eFe2d75
        // The PIP-4 deactivated this code:
        // https://docs.pantherprotocol.io/dao/governance/proposal-4-polygon-fix
        return (balance * (_timeNow - startTime)) / (endTime - startTime);
    }

    modifier nonZeroAddress(address account) {
        require(account != address(0), "RP: zero address");
        _;
    }
}
