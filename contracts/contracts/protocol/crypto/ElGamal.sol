// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./BabyJubJub.sol";
import "../../common/Types.sol";

contract ElGamalEncryption {
    function add(ElGamalCiphertext memory ct1, ElGamalCiphertext memory ct2)
        external
        view
        returns (ElGamalCiphertext memory ct3)
    {
        ct3.c1 = BabyJubJub.pointAdd(ct1.c1, ct2.c1);
        ct3.c2 = BabyJubJub.pointAdd(ct1.c2, ct2.c2);
    }
}
