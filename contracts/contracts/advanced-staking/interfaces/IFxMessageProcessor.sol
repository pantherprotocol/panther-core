// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/***
 * @dev A receiver on the Polygon (or Mumbai) network of a message sent over the
 * "Fx-Portal" must implement this interface.
 * The "Fx-Portal" is the PoS bridge run by the Polygon team.
 * See https://docs.polygon.technology/docs/develop/l1-l2-communication/fx-portal
 */
interface IFxMessageProcessor {
    function processMessageFromRoot(
        uint256 stateId,
        address rootMessageSender,
        bytes calldata data
    ) external;
}
