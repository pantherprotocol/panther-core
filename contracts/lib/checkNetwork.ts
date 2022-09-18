import {HardhatRuntimeEnvironment} from 'hardhat/types';

export function isLocal(hre: HardhatRuntimeEnvironment): boolean {
    // network.live does not work for pchain
    return !!hre.network.name.match(/^hardhat|pchain$/);
}
