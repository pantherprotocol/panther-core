import {HardhatRuntimeEnvironment} from 'hardhat/types';

export function isLocal(hre: HardhatRuntimeEnvironment): boolean {
    // network.live does not work for pchain
    return !!hre.network.name.match(/^hardhat|pchain|localhost$/);
}

export function isMainnetOrGoerli(hre: HardhatRuntimeEnvironment): boolean {
    return hre.network.name === 'mainnet' || hre.network.name === 'goerli';
}

export function isPolygonOrMumbai(hre: HardhatRuntimeEnvironment): boolean {
    return hre.network.name === 'polygon' || hre.network.name === 'mumbai';
}
