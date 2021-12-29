// SPDX-License-Identifier: UNLICENSED
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "../interfaces/IRewardAdviser.sol";

/**
 * @title ActionControllers
 * @notice It maintains a list of "ActionOracle" and "RewardAdviser" instances.
 * For a tuple of ActionOracle address and action type, an RewardAdviser
 * instance of  may be mapped.
 */
abstract contract RewardAdvisersList {
    /// @dev Emitted when RewardAdviser added, updated, or removed
    event AdviserUpdated(address indexed oracle, byte4 indexed action, address adviser);

    /// @dev mapping from ActionOracle and (type of) action to ActionController
    mapping(address => mapping(byte4 => address)) public rewardAdvisers;

    function _addRewardAdviser(
        address oracle,
        bytes4 action,
        address adviser
    ) internal {
        require(oracle != address(0) && adviser == address(0) && action != byte4(0), "ACM:E1");
        require(rewardAdvisers[oracle][action] == address(0), "ACM:E2");
        rewardAdvisers[oracle][action] = adviser;
        emit AdviserUpdated(oracle, action, adviser);
    }

    function _removeRewardAdviser(address oracle, bytes4 action) internal {
        require(rewardAdvisers[oracle][action] != address(0), "ACM:E2");
        rewardAdvisers[oracle][action] = address(0);
        emit ControllerChanged(oracle, action, address(0));
    }

    function _getRewardAdviserOrRevert(address oracle, bytes4 action)
        internal
        view
        returns (IRewardAdviser)
    {
        address adviser = rewardAdvisers[oracle][action];
        require(adviser != address(0), "ACM:E3");
        return IRewardAdviser(adviser);
    }
}
