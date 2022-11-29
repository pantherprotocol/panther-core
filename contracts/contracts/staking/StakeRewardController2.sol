// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// slither-disable-next-line solc-version
pragma solidity 0.8.4;

import "./interfaces/IRewardAdviser.sol";

interface IEntitled {
    function entitled(address) external view returns (uint256);
}

/**
 * @title StakeRewardController2
 * @notice A bug in RewardPool contract at eth:0xcF463713521Af5cE31AD18F6914f3706493F10e5, after
 * the `endTime`, prevents the RewardMaster (eth:0x347a58878D04951588741d4d16d54B742c7f60fC) from
 * sending staking reward tokens to stakers. This contract implements a work-around.
 * @dev On `unstake` method call on the Staking (eth:0xf4d06d72dACdD8393FA4eA72FdcC10049711F899),
 * the later calls the RewardMaster, which then calls `getRewardAdvice` method on this contract
 * to process the `UNSTAKED` messages.
 * This contract returns the "advice" for the RewardMaster with zero `sharesToRedeem`. On the zero
 * advice received, the RewardMaster skips sending reward tokens to the staker, so the buggy code
 * `require(timeNow() < endTime` in the `RewardPool::vestRewards` method does not get called.
 * Furthermore, this contract transfers reward tokens to a staker instead of the RewardMaster as
 * follows. As a part of the `getRewardAdvice` call, this contract:
 * - requests the RewardMaster on the amount of rewards that the staker is already entitled to
 * (there are no mare rewards expected, as the rewarded period ended)
 * - sends the reward amount from this its balance to the staker
 * As a prerequisite, this contract:
 * - shall be authorized as the "RewardAdviser" with the RewardMaster for "classic" stakes
 * - shall hold reward tokens on its balance
 */
// slither-disable-next-line missing-inheritance
contract StakeRewardController2 is IRewardAdviser {
    // solhint-disable var-name-mixedcase

    /// @notice The owner who has privileged rights
    address public immutable OWNER;

    /// @notice The ERC20 token to pay rewards in
    address public immutable REWARD_TOKEN;

    /// @notice Staking contract instance that handles stakes
    address public immutable STAKING;

    /// @notice RewardMaster instance authorized to call `getRewardAdvice` on this contract
    address public immutable REWARD_MASTER;

    // bytes4(keccak256("classic"))
    // slither-disable-next-line unused-state
    bytes4 private constant STAKE_TYPE = 0x4ab0941a;
    // bytes4(keccak256(abi.encodePacked(bytes4(keccak256("unstake"), STAKE_TYPE)))
    bytes4 private constant UNSTAKE = 0x493bdf45;

    // 2022-08-15T00:00:00.000Z
    uint256 private constant ZKP_RESCUE_ALLOWED_SINCE = 1660521600;

    // solhint-enable var-name-mixedcase

    uint256 public unclaimedRewards;
    /// @notice Mapping from staker to claimed reward amount
    mapping(address => uint256) public rewardsClaimed;

    uint256 private _reentrancyStatus;

    /// @dev Emitted when reward paid to a staker
    event RewardPaid(address indexed staker, uint256 reward);

    /// @dev Emitted on activation of this contract
    event Activated(uint256 _activeSince, uint256 _totalStaked, uint256 scArpt);

    constructor(
        address _owner,
        address token,
        address stakingContract,
        address rewardMaster,
        uint256 _unclaimedRewards
    ) {
        require(
            _unclaimedRewards != 0 &&
                _owner != address(0) &&
                token != address(0) &&
                stakingContract != address(0) &&
                rewardMaster != address(0),
            "SRC: E1"
        );

        OWNER = _owner;
        REWARD_TOKEN = token;
        STAKING = stakingContract;
        REWARD_MASTER = rewardMaster;
        unclaimedRewards = _unclaimedRewards;
    }

    function getRewardAdvice(bytes4 action, bytes memory message)
        external
        override
        returns (Advice memory)
    {
        require(msg.sender == REWARD_MASTER, "SRC: unauthorized");
        require(action == UNSTAKE, "SRC: unexpected action");

        address staker = _decodeStakerFromMsg(message);
        require(staker != address(0), "SRC: unexpected zero staker");

        _payRewardIfNotYetPaid(staker);

        return
            Advice(
                address(0), // createSharesFor
                0, // sharesToCreate
                address(0), // redeemSharesFrom
                0, // sharesToRedeem
                address(this) // sendRewardTo
            );
    }

    /// @notice Returns reward token amount entitled to the given user/account
    function entitled(address staker) external view returns (uint256 rewards) {
        rewards = (rewardsClaimed[staker] == 0)
            ? _getEntitledReward(staker)
            : 0;
    }

    /// @notice Withdraws unclaimed rewards or accidentally sent token from this contract
    /// @dev May be only called by the {OWNER}
    function rescueErc20(
        address token,
        address to,
        uint256 amount
    ) external {
        require(_reentrancyStatus != 1, "SRC: can't be re-entered");
        // slither-disable-next-line write-after-write
        _reentrancyStatus = 1;

        require(OWNER == msg.sender, "SRC: unauthorized");
        // Time comparison is acceptable in this case since block time accuracy is enough for this scenario
        // slither-disable-next-line timestamp
        require(
            (token != REWARD_TOKEN) ||
                (block.timestamp >= ZKP_RESCUE_ALLOWED_SINCE),
            "SRC: too early withdrawal"
        );

        _transferErc20(token, to, amount);
        // state variable intentionally written after the external call
        // slither-disable-next-line reentrancy-no-eth
        _reentrancyStatus = 2;
    }

    function _payRewardIfNotYetPaid(address staker) internal {
        // Do nothing if already paid
        if (rewardsClaimed[staker] != 0) return;

        uint256 reward = _getEntitledReward(staker);
        if (reward == 0) return;

        uint256 _unclaimedRewards = unclaimedRewards;

        // Precaution against imprecise calculations/roundings
        if (reward > _unclaimedRewards) reward = _unclaimedRewards;

        rewardsClaimed[staker] = reward;
        unclaimedRewards = _unclaimedRewards - reward;

        // trusted contract - reentrancy guard unneeded
        // slither-disable-next-line reentrancy-benign,reentrancy-events
        _transferErc20(REWARD_TOKEN, staker, reward);
        emit RewardPaid(staker, reward);
    }

    function _decodeStakerFromMsg(bytes memory message)
        internal
        pure
        returns (address staker)
    {
        uint256 stakerAndAmount;
        // solhint-disable no-inline-assembly
        // slither-disable-next-line assembly
        assembly {
            // the 1st word (32 bytes) contains the `message.length`
            // we need the (entire) 2nd word ..
            stakerAndAmount := mload(add(message, 0x20))
        }
        // solhint-enable no-inline-assembly
        staker = address(uint160(stakerAndAmount >> 96));
    }

    // Declared as `internal` to ease testing
    function _getEntitledReward(address staker)
        internal
        view
        returns (uint256 reward)
    {
        // trusted contract - reentrancy guard unneeded
        // slither-disable-next-line reentrancy-benign
        reward = IEntitled(REWARD_MASTER).entitled(staker);
    }

    function _transferErc20(
        address token,
        address to,
        uint256 value
    ) internal {
        // solhint-disable avoid-low-level-calls
        // slither-disable-next-line low-level-calls
        (bool success, bytes memory data) = token.call(
            // bytes4(keccak256(bytes('transfer(address,uint256)')));
            abi.encodeWithSelector(0xa9059cbb, to, value)
        );
        // solhint-enable avoid-low-level-calls
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "SRC: transferErc20 failed"
        );
    }
}
