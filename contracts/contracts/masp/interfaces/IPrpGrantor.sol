// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

/**
 * @title IPrpGrantor
 * @notice Interface for the `PrpGrantor` contract
 * @dev Excluding `onlyOwner` functions
 */
interface IPrpGrantor {
    /// @notice Return the address of the "grant processor"
    /// @dev This account only is authorized to call `redeemGrant`
    function grantProcessor() external view returns (address);

    /// @notice Returns the total amount (in PRPs) of grants issued so far
    /// (excluding burnt grants)
    function totalGrantsIssued() external returns (uint256);

    /// @notice Returns the total amount (in PRPs) of grants redeemed so far
    function totalGrantsRedeemed() external returns (uint256);

    /// @notice Returns the total amount (in PRPs) of unused grants for the given grantee
    function getUnusedGrantAmount(address grantee)
        external
        view
        returns (uint256 prpAmount);

    /// @notice Returns the PRP amount of the grant specified by a given curator and type
    function getGrantAmount(address curator, bytes4 grantType)
        external
        view
        returns (uint256 prpAmount);

    /// @notice Increase the amount of "unused" grants for the given grantee, by the amount
    /// defined for the given "grant type"
    /// @return prpAmount The amount (in PRPs) of the grant
    /// @dev An authorized "curator" may call with the enabled (added) "grant type" only
    function issueGrant(address grantee, bytes4 grantType)
        external
        returns (uint256 prpAmount);

    /// @notice Increase the amount of "unused" grants for the given grantee, by the amount
    /// specified.
    /// @dev Only the owner may call.
    function issueOwnerGrant(address grantee, uint256 prpAmount) external;

    /// @notice Burn unused grants for the msg.sender in the specified PRP amount
    function burnGrant(uint256 prpAmount) external;

    /// @notice Account for redemption of grants in the given amount for the given grantee
    /// @dev Only the account returned by `grantProcessor()` may call
    function redeemGrant(address grantee, uint256 prpAmount) external;

    /// @notice PRP grant issued
    event PrpGrantIssued(
        bytes4 indexed grantType,
        address grantee,
        uint256 prpAmount
    );

    /// @notice PRP grant redeemed (used)
    event PrpGrantRedeemed(address grantee, uint256 prpAmount);

    /// @notice PRP grant burnt
    event PrpGrantBurnt(address grantee, uint256 prpAmount);

    /// @notice New grant type added
    event PrpGrantEnabled(address curator, bytes4 grantType, uint256 prpAmount);

    /// @notice Existing grant type disabled
    event PrpGrantDisabled(address curator, bytes4 grantType);
}
