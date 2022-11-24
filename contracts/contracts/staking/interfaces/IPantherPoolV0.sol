// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import { G1Point } from "../../common/Types.sol";
import { CIPHERTEXT1_WORDS, OUT_MAX_UTXOs, PATH_ELEMENTS_NUM } from "../../common/Constants.sol";

/**
 * @notice (Truncated) Interface of the PantherPoolV0
 * @dev Only those functions and events included which the `AdvancedStakeRewardController` contract uses
 */
interface IPantherPoolV0 {
    /**
     * @notice Transfer assets from the msg.sender to the VAULT and generate UTXOs in the MASP
     * @param tokens Address of the token contract for every UTXO
     * @dev For PRP granted the address ot this contract (proxy) is supposed to be used
     * @param tokenIds For ERC-721 and ERC-1155 - token ID or subId of the token, 0 for ERC-20
     * @param extAmounts Token amounts (external) to be deposited
     * @param pubSpendingKeys Public Spending Key for every UTXO
     * @param secrets Encrypted opening values for every UTXO
     * @param  createdAt Optional, if 0 network time used
     * @dev createdAt must be less (or equal) the network time
     * @return leftLeafId The `leafId` of the first UTXO (leaf) in the batch
     */
    function generateDeposits(
        address[OUT_MAX_UTXOs] calldata tokens,
        uint256[OUT_MAX_UTXOs] calldata tokenIds,
        uint256[OUT_MAX_UTXOs] calldata extAmounts,
        G1Point[OUT_MAX_UTXOs] calldata pubSpendingKeys,
        uint256[CIPHERTEXT1_WORDS][OUT_MAX_UTXOs] calldata secrets,
        uint32 createdAt
    ) external returns (uint256 leftLeafId);

    function exit(
        address token,
        uint256 tokenId,
        uint256 amount,
        uint32 creationTime,
        uint256 privSpendingKey,
        uint256 leafId,
        bytes32[PATH_ELEMENTS_NUM] calldata pathElements,
        bytes32 merkleRoot,
        uint256 cacheIndexHint
    ) external;

    /**
     * @return Address of the Vault
     */
    // solhint-disable-next-line func-name-mixedcase
    function VAULT() external view returns (address);

    /**
     * @dev Emitted on a new batch of Commitments
     * @param leftLeafId The `leafId` of the first leaf in the batch
     * @dev `leafId = leftLeafId + 1` for the 2nd leaf (`leftLeafId + 2` for the 3rd leaf)
     * @param commitments Commitments hashes
     * @param utxoData opening values (encrypted and public) for UTXOs
     */
    event NewCommitments(
        uint256 indexed leftLeafId,
        uint256 creationTime,
        bytes32[OUT_MAX_UTXOs] commitments,
        bytes utxoData
    );

    /**
     * Nullifier is seen (i.e. UTXO is spent)
     */
    event Nullifier(bytes32 nullifier);
}
