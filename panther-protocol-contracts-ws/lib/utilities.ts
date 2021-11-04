// SPDX-License-Identifier: MIT
import { ethers } from 'hardhat';

const zeroLeaf =
    '0x0667764c376602b72ef22218e1673c2cc8546201f9a77807570b3e5de137680d';

const zeroTriadTreeRoot =
    '0x20fc043586a9fcb416cdf2a3bc8a995f8f815d43f1046a20d1c588cf20482a55';

export { toBigNum, toBytes32, zeroLeaf, zeroTriadTreeRoot };

function toBigNum(n: number | string) {
    return ethers.BigNumber.from(n);
}

function toBytes32(n: number | string) {
    return (
        '0x' +
        ethers.utils
            .hexlify(ethers.BigNumber.from(n))
            .replace('0x', '')
            .padStart(64, '0')
    );
}
