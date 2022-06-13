// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "./common/ErrorMsgs.sol";
import "./common/ImmutableOwnable.sol";
import "./interfaces/IPrpGrantor.sol";

/**
 * @title PrpGrantor
 * @notice It registers issuing and redemption of PRP-nominated "grants"
 * @dev The owner may add (enable) new "grant types" or remove (disable) existing types. For every
 * type, the owner specifies (authorizes) the account of the "curator" and the amount of the grant
 * (in Panther Reward Points, aka "PRPs").
 * A curator calls `issueGrant` on this contract to issue a "grant" of a certain type to a grantee.
 * The curator must be authorized by the owner for this grant type. The `issueGrant` call increases
 * the amount (in PRPs) of "unused grants" for a grantee.
 * The authorized "processor" (one for all grant types) may call `redeemGrant` to account for usage
 * (i.e.  redemption) of grants. Every `redeemGrant` call decreases the amount of unused grants for
 * a grantee.
 * Assumed:
 * - the "processor" is the `PantherPool` contract
 * - a grant is redeemed when the PantherPool creates a PRP-nominated UTXO for a grantee.
 */
contract PrpGrantor is ImmutableOwnable, IPrpGrantor {
    // The contract is supposed to run behind a proxy DELEGATECALLing it.
    // On upgrades, adjust `__gap` to match changes of the storage layout.
    uint256[50] private __gap;

    // solhint-disable var-name-mixedcase

    // Max amount in PRPs
    uint256 private constant MAX_PRP_GRANT = 2**64;

    // To distinguish "undefined" from "zero"
    uint256 private constant ZERO_AMOUNT = 1;
    uint256 private constant UNDEF_AMOUNT = 0;

    // Account authorized to call `redeemGrant`
    address private immutable GRANT_PROCESSOR;

    // solhint-enable var-name-mixedcase

    /// @dev Mapping from "curator" to "grant type" to "grant amount in PRPs"
    /// To distinguish "zero" from "undefined", values are biased by `ZERO_AMOUNT`
    mapping(address => mapping(bytes4 => uint256)) private _prpGrantsAmounts;

    /// @dev mapping from "grantee" to the PRP amount that may be "used"
    mapping(address => uint256) private _unusedPrpGrants;

    // Total amount (in PRPs) of grants issued so far
    uint256 public override totalGrantsIssued;

    // Total amount (in PRPs) of grants redeemed so far
    // (excluding burnt grants amounts)
    uint256 public override totalGrantsRedeemed;

    constructor(address _owner, address _grantProcessor)
        ImmutableOwnable(_owner)
    {
        // As it runs behind the DELEGATECALL'ing proxy, initialization of
        // immutable "vars" only is allowed in the constructor
        require(_grantProcessor != address(0), ERR_ZERO_PROCESSOR_ADDR);
        GRANT_PROCESSOR = _grantProcessor;
    }

    /// @inheritdoc IPrpGrantor
    function grantProcessor() external view override returns (address) {
        return GRANT_PROCESSOR;
    }

    /// @inheritdoc IPrpGrantor
    function getUnusedGrantAmount(address grantee)
        external
        view
        override
        returns (uint256 prpAmount)
    {
        return _unusedPrpGrants[grantee];
    }

    /// @inheritdoc IPrpGrantor
    function getGrantAmount(address curator, bytes4 grantType)
        external
        view
        override
        returns (uint256 prpAmount)
    {
        prpAmount = _prpGrantsAmounts[curator][grantType];
        _revertOnUndefPrpAmount(prpAmount);
        unchecked {
            prpAmount -= ZERO_AMOUNT;
        }
    }

    /// @inheritdoc IPrpGrantor
    function issueGrant(address grantee, bytes4 grantType)
        external
        override
        nonZeroGrantType(grantType)
        returns (uint256 prpAmount)
    {
        require(grantee != address(0), ERR_ZERO_GRANTEE_ADDR);
        prpAmount = _prpGrantsAmounts[msg.sender][grantType];
        _revertOnUndefPrpAmount(prpAmount);

        unchecked {
            // Here and in other `unchecked` blocks, overflow/underflow is impossible since:
            // - prpAmount is limited when granted and can never exceed MAX_PRP_GRANT
            // - prpAmount is checked to be less or equal the value it's subtracted from
            // - unrealistic to expect prpAmount additions exceed 2**256
            prpAmount -= ZERO_AMOUNT;
            if (prpAmount != 0) {
                uint256 newBalance = _unusedPrpGrants[grantee] + prpAmount;
                _revertOnTooBigPrpAmount(newBalance);
                _unusedPrpGrants[grantee] = newBalance;
                // Can't overflow since grants amounts are limited
                totalGrantsIssued += prpAmount;
            }
        }
        emit PrpGrantIssued(grantType, grantee, prpAmount);
    }

    /// @inheritdoc IPrpGrantor
    function burnGrant(uint256 prpAmount) external override {
        uint256 oldBalance = _unusedPrpGrants[msg.sender];
        require(oldBalance >= prpAmount, ERR_LOW_GRANT_BALANCE);
        unchecked {
            _unusedPrpGrants[msg.sender] = oldBalance - prpAmount;
            totalGrantsIssued -= prpAmount;
        }
        emit PrpGrantBurnt(msg.sender, prpAmount);
    }

    /// @inheritdoc IPrpGrantor
    function redeemGrant(address grantee, uint256 prpAmount) external override {
        require(msg.sender == GRANT_PROCESSOR, ERR_UNAUTHORIZED_CALL);
        uint256 oldBalance = _unusedPrpGrants[grantee];
        require(oldBalance >= prpAmount, ERR_LOW_GRANT_BALANCE);
        unchecked {
            _unusedPrpGrants[grantee] = oldBalance - prpAmount;
            totalGrantsRedeemed += prpAmount;
        }
        emit PrpGrantRedeemed(grantee, prpAmount);
    }

    /// @dev Add a new "grant type", with the specified amount (in PRPs) of the grant, and
    /// allow the specified "curator" to issue grants of this type (by calling `issueGrant`).
    /// Only the owner may call.
    function enableGrantType(
        address curator,
        bytes4 grantType,
        uint256 prpAmount
    ) external onlyOwner nonZeroGrantType(grantType) {
        require(curator != address(0), ERR_ZERO_CURATOR_ADDR);
        _revertOnTooBigPrpAmount(prpAmount);
        require(
            _prpGrantsAmounts[curator][grantType] == UNDEF_AMOUNT,
            ERR_GRANT_TYPE_EXISTS
        );
        _prpGrantsAmounts[curator][grantType] = ZERO_AMOUNT + prpAmount;
        emit PrpGrantEnabled(curator, grantType, prpAmount);
    }

    /// @dev Disable previously enabled "grant type".
    /// Only the owner may call.
    function disableGrantType(address curator, bytes4 grantType)
        external
        onlyOwner
        nonZeroGrantType(grantType)
    {
        _revertOnUndefPrpAmount(_prpGrantsAmounts[curator][grantType]);
        _prpGrantsAmounts[curator][grantType] = UNDEF_AMOUNT;
        emit PrpGrantDisabled(curator, grantType);
    }

    /// Modifiers and private functions follow

    modifier nonZeroGrantType(bytes4 grantType) {
        require(grantType != bytes4(0), ERR_UKNOWN_GRANT_TYPE);
        _;
    }

    function _revertOnTooBigPrpAmount(uint256 prpAmount) private pure {
        require(prpAmount <= MAX_PRP_GRANT, ERR_TOO_LARGE_GRANT_AMOUNT);
    }

    function _revertOnUndefPrpAmount(uint256 prpAmount) private pure {
        require(prpAmount != UNDEF_AMOUNT, ERR_UNDEF_GRANT);
    }
}
