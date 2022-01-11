// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

// mocked methods of ZKPToken
contract TokenMock is ERC20Permit {
    constructor() ERC20Permit("TEST") ERC20("TEST", "TT") {
        _mint(msg.sender, 1e27);
    }
}
