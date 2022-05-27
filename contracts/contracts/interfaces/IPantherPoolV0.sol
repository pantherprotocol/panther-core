// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { G1Point } from "../common/Types.sol";
import { CIPHERTEXT1_WORDS, OUT_UTXOs, PATH_ELEMENTS_NUM } from "../common/Constants.sol";

interface IPantherPoolV0 {
    function grant(address grantee, bytes4 grantType)
        external
        returns (uint256 prpAmount);

    function generateDeposits(
        address[OUT_UTXOs] calldata tokens,
        uint256[OUT_UTXOs] calldata tokenIds,
        uint256[OUT_UTXOs] calldata extAmounts,
        G1Point[OUT_UTXOs] calldata pubSpendingKeys,
        uint256[CIPHERTEXT1_WORDS][OUT_UTXOs] calldata secrets,
        uint256 createdAt
    ) external returns (uint256 leftLeafId);

    function exit(
        address token,
        uint256 tokenId,
        uint256 amount,
        uint256 creationTime,
        uint256 privSpendingKey,
        uint256 leafId,
        bytes32[PATH_ELEMENTS_NUM] calldata pathElements,
        bytes32 merkleRoot,
        uint256 cacheIndexHint
    ) external;

    // solhint-disable-next-line func-name-mixedcase
    function VAULT() external view returns (address);
}
