// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../common/ErrorMsgs.sol";

/**
 * @title PrpGrantor
 * @notice It registers issuing and redemption of PRP-nominated "grants"
 * @dev Authorized "curators" may call `grant` on this contract to issue a "grant" of a specified
 * "grant type" to a "grantee" .
 * Grants are nominated in Panther Reward Points ("PRP"). The amount of a grant is defined by its
 * type. Every grant increases the amount (in PRPs) of "unused grants" for a grantee.
 * The child contract (i.e. the `PantherPool`) calls `useGrant` to account for redemption ("use")
 * of grants (i.e. to decrease the unused grant amount for a grantee).
 * Granted amounts are supposed to be "redeemed" when the Panther Protocol Multi-Asset Shielded
 * Pool (the "MASP") creates for a user a new UTXO, nominated in PRPs, in the "redeemed" amount.
 */
abstract contract PrpGrantor {
    // solhint-disable var-name-mixedcase

    // Max amount in PRPs
    uint256 internal constant MAX_PRP_GRANT = 2**64;

    // To distinguish "undefined" from "zero"
    uint256 internal constant ZERO_AMOUNT = 1;
    uint256 internal constant UNDEF_AMOUNT = 0;

    // zAssetId (i.e. "token" in the UTXO preimage) of PRPs
    // keccak256('Panther Reward Point') >> 96
    uint160 internal constant PRP_ZASSET_ID =
        0x000000000000000000000000bb432d4ecd82dd023cb8ebc510121065bade2466;

    // solhint-enable var-name-mixedcase

    /// @dev Mapping from "curator" to "grant type" to "grant amount in PRPs"
    /// To distinguish "zero" from "undefined", values are biased by `ZERO_AMOUNT`
    mapping(address => mapping(bytes4 => uint256)) private _prpGrantsAmounts;

    /// @dev mapping from "grantee" to the PRP amount that may be "used"
    mapping(address => uint256) private _unusedPrpGrants;

    /// @notice Total amount (in PRPs) of booked grants
    uint256 public totalPrpGranted;
    /// @notice Total amount (in PRPs) of used grants
    uint256 public totalUsedPrpGrants;

    /// @notice PRP grant issued
    event PrpGrantIssued(
        bytes4 indexed grantType,
        address grantee,
        uint256 prpAmount
    );
    /// @notice PRP grant used (redeemed)
    event PrpGrantUsed(address grantee, uint256 prpAmount);
    /// @notice PRP grant burnt
    event PrpGrantBurnt(address grantee, uint256 prpAmount);

    /// @dev New grant type added
    event PrpGrantEnabled(address curator, bytes4 grantType, uint256 prpAmount);
    /// @dev Existing grant type disabled
    event PrpGrantDisabled(address curator, bytes4 grantType);

    /// @notice It returns the total amount (in PRPs) of unused grants for the given grantee
    function getUnusedGrant(address grantee)
        external
        view
        returns (uint256 prpAmount)
    {
        prpAmount = _unusedPrpGrants[grantee];
        unchecked {
            if (prpAmount >= ZERO_AMOUNT) prpAmount -= ZERO_AMOUNT;
        }
    }

    /// @notice It returns the PRP amount of the grant specified by a given curator and type
    function getGrantAmount(address curator, bytes4 grantType)
        external
        view
        returns (uint256 prpAmount)
    {
        prpAmount = _prpGrantsAmounts[curator][grantType];
        _revertOnUndefPrpAmount(prpAmount);
        unchecked {
            prpAmount -= ZERO_AMOUNT;
        }
    }

    /// @notice Increase the "unused grants" amount (in PRPs) of the given grantee by the amount
    /// defined by the given "grant type"
    /// @return prpAmount The amount (in PRPs) of the grant
    /// @dev An authorized "curator" may call with the enabled (added) "grant type" only
    function grant(address grantee, bytes4 grantType)
        external
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
                totalPrpGranted += prpAmount;
            }
        }
        emit PrpGrantIssued(grantType, grantee, prpAmount);
    }

    /// @notice Burn unused grants for the msg.sender in the specified PRP amount
    function burnGrant(uint256 prpAmount) external {
        uint256 oldBalance = _unusedPrpGrants[msg.sender];
        require(oldBalance >= prpAmount, ERR_LOW_GRANT_BALANCE);
        unchecked {
            _unusedPrpGrants[msg.sender] = oldBalance - prpAmount;
            totalPrpGranted -= prpAmount;
        }
        emit PrpGrantBurnt(msg.sender, prpAmount);
    }

    /// @dev Account for redemption of "unused grants" in the given PRP amount for the given grantee
    /// The child contract calls it when the MASP creates a new UTXO in the amount being redeemed
    function useGrant(address grantee, uint256 prpAmount) internal {
        uint256 oldBalance = _unusedPrpGrants[grantee];
        require(oldBalance >= prpAmount, ERR_LOW_GRANT_BALANCE);
        unchecked {
            _unusedPrpGrants[grantee] = oldBalance - prpAmount;
            totalUsedPrpGrants += prpAmount;
        }
        emit PrpGrantUsed(grantee, prpAmount);
    }

    /// @dev Add a new "grant type", with the specified amount (in PRPs) of the grant, and
    /// allow the specified "curator" to issue grants of this type (by calling `grant`).
    /// It's supposed to be called by a privileged account ("owner") only.
    function enableGrantType(
        address curator,
        bytes4 grantType,
        uint256 prpAmount
    ) internal nonZeroGrantType(grantType) {
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
    /// It's supposed to be called by a privileged account ("owner") only.
    function disableGrantType(address curator, bytes4 grantType)
        internal
        nonZeroGrantType(grantType)
    {
        _revertOnUndefPrpAmount(_prpGrantsAmounts[curator][grantType]);
        _prpGrantsAmounts[curator][grantType] = UNDEF_AMOUNT;
        emit PrpGrantDisabled(curator, grantType);
    }

    /// Modifiers, internal and private functions follow

    modifier nonZeroGrantType(bytes4 grantType) {
        require(grantType != bytes4(0), ERR_UKNOWN_GRANT_TYPE);
        _;
    }

    function _revertOnTooBigPrpAmount(uint256 prpAmount) internal pure virtual {
        require(prpAmount <= MAX_PRP_GRANT, ERR_TOO_LARGE_GRANT_AMOUNT);
    }

    function _revertOnUndefPrpAmount(uint256 prpAmount) internal pure virtual {
        require(prpAmount != UNDEF_AMOUNT, ERR_UNDEF_GRANT);
    }

    // The contract is supposed to run behind a proxy DELEGATECALLing it.
    // For compatibility on upgrades, decrease `__gap` if new variables added.
    uint256[50] private __gap;
}
