// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// slither-disable-next-line solc-version
pragma solidity ^0.8.4;

import "./IStakingTypes.sol";

interface IStakeRegister {
    function stakes(address _account, uint256 _stakeId)
        external
        view
        returns (IStakingTypes.Stake memory);

    function accountStakes(address _account)
        external
        view
        returns (IStakingTypes.Stake[] memory);
}
