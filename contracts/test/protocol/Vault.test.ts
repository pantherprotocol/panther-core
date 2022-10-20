// SPDX-License-Identifier: MIT
import {FakeContract, smock} from '@defi-wonderland/smock';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import chai, {expect} from 'chai';
import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

import {toBigNum} from '../../lib/utilities';
import {
    Vault,
    IMockErc20,
    IMockErc721,
    IMockErc1155,
} from '../../types/contracts';

chai.use(smock.matchers);

describe('Vault contract', function () {
    let vault: Vault;
    let erc20Token: FakeContract<IMockErc20>;
    let erc721Token: FakeContract<IMockErc721>;
    let erc1155Token: FakeContract<IMockErc1155>;
    let owner: SignerWithAddress;
    let extAccount: SignerWithAddress;
    let lockData: LockData;

    const TokenType = {
        Erc20: toBigNum('0x00'),
        Erc721: toBigNum('0x10'),
        Erc1155: toBigNum('0x11'),
        unknown: toBigNum('0x99'),
    };

    before(async function () {
        [owner, extAccount] = await ethers.getSigners();

        const Vault = await ethers.getContractFactory('Vault');
        vault = (await Vault.deploy(owner.address)) as Vault;

        erc20Token = await smock.fake('IMockErc20');
        erc721Token = await smock.fake('IMockErc721');
        erc1155Token = await smock.fake('IMockErc1155');
    });

    describe('when lock/unlock assets', () => {
        describe('Erc20', () => {
            before(() => {
                erc20Token.transferFrom.returns(true);
                erc20Token.transfer.returns(true);

                lockData = genLockData(TokenType.Erc20, erc20Token.address);
            });
            it('should lock erc20', async () => {
                await expect(vault.lockAsset(lockData))
                    .to.emit(vault, 'Locked')
                    .withArgs([
                        lockData.tokenType,
                        lockData.token,
                        lockData.tokenId,
                        lockData.extAccount,
                        lockData.extAmount,
                    ]);

                expect(erc20Token.transferFrom).to.have.been.calledWith(
                    extAccount.address,
                    vault.address,
                    lockData.extAmount,
                );
            });

            it('should unlock erc20', async () => {
                await expect(vault.unlockAsset(lockData))
                    .to.emit(vault, 'Unlocked')
                    .withArgs([
                        lockData.tokenType,
                        lockData.token,
                        lockData.tokenId,
                        lockData.extAccount,
                        lockData.extAmount,
                    ]);

                expect(erc20Token.transfer).to.have.been.calledWith(
                    extAccount.address,
                    lockData.extAmount,
                );
            });
        });

        describe('Erc721', () => {
            before(() => {
                erc721Token[
                    'safeTransferFrom(address,address,uint256)'
                ].returns(true);

                lockData = genLockData(TokenType.Erc721, erc721Token.address);
            });

            it('should lock erc721', async () => {
                await expect(vault.lockAsset(lockData))
                    .to.emit(vault, 'Locked')
                    .withArgs([
                        lockData.tokenType,
                        lockData.token,
                        lockData.tokenId,
                        lockData.extAccount,
                        lockData.extAmount,
                    ]);

                expect(
                    erc721Token['safeTransferFrom(address,address,uint256)'],
                ).to.have.been.calledWith(
                    extAccount.address,
                    vault.address,
                    lockData.tokenId,
                );
            });

            it('should unlock erc721', async () => {
                await expect(vault.unlockAsset(lockData))
                    .to.emit(vault, 'Unlocked')
                    .withArgs([
                        lockData.tokenType,
                        lockData.token,
                        lockData.tokenId,
                        lockData.extAccount,
                        lockData.extAmount,
                    ]);

                expect(
                    erc721Token['safeTransferFrom(address,address,uint256)'],
                ).to.have.been.calledWith(
                    vault.address,
                    extAccount.address,
                    lockData.tokenId,
                );
            });
        });

        describe('Erc1155', () => {
            before(() => {
                erc1155Token.safeTransferFrom.returns(true);

                lockData = genLockData(TokenType.Erc1155, erc1155Token.address);
            });
            it('should lock erc1155', async () => {
                await expect(vault.lockAsset(lockData))
                    .to.emit(vault, 'Locked')
                    .withArgs([
                        lockData.tokenType,
                        lockData.token,
                        lockData.tokenId,
                        lockData.extAccount,
                        lockData.extAmount,
                    ]);

                expect(erc1155Token.safeTransferFrom).to.have.been.calledWith(
                    extAccount.address,
                    vault.address,
                    lockData.tokenId,
                    lockData.extAmount,
                    '0x',
                );
            });

            it('should unlock erc1155', async () => {
                await expect(vault.unlockAsset(lockData))
                    .to.emit(vault, 'Unlocked')
                    .withArgs([
                        lockData.tokenType,
                        lockData.token,
                        lockData.tokenId,
                        lockData.extAccount,
                        lockData.extAmount,
                    ]);

                expect(erc1155Token.safeTransferFrom).to.have.been.calledWith(
                    vault.address,
                    extAccount.address,
                    lockData.tokenId,
                    lockData.extAmount,
                    '0x',
                );
            });
        });
    });

    describe('Fail cases', () => {
        describe('when lock/unlock by non owner', () => {
            before(() => {
                lockData = genLockData(TokenType.Erc20, erc20Token.address);
            });
            it('should revert on lock', async () => {
                await expect(
                    vault.connect(extAccount).lockAsset(lockData),
                ).to.be.revertedWith('ImmOwn: unauthorized');
            });

            it('should revert on unlock', async () => {
                await expect(
                    vault.connect(extAccount).unlockAsset(lockData),
                ).to.be.revertedWith('ImmOwn: unauthorized');
            });
        });

        describe('when lock/unlock unknown token', () => {
            before(() => {
                lockData = genLockData(TokenType.unknown, erc20Token.address);
            });
            it('should revert on lock', async () => {
                await expect(vault.lockAsset(lockData)).to.be.revertedWith(
                    'VA:E1',
                );
            });

            it('should revert on unlock', async () => {
                await expect(vault.unlockAsset(lockData)).to.be.revertedWith(
                    'VA:E1',
                );
            });
        });

        describe('when lock/unlock token with zero token address', () => {
            before(() => {
                lockData = genLockData(TokenType.Erc20, erc20Token.address);
                lockData.token = ethers.constants.AddressZero;
            });
            it('should revert on lock', async () => {
                await expect(vault.lockAsset(lockData)).to.be.revertedWith(
                    'VA:E2',
                );
            });

            it('should revert on unlock', async () => {
                await expect(vault.unlockAsset(lockData)).to.be.revertedWith(
                    'VA:E2',
                );
            });
        });

        describe('when lock/unlock with zero receiver address', () => {
            before(() => {
                lockData = genLockData(TokenType.Erc20, erc20Token.address);
                lockData.extAccount = ethers.constants.AddressZero;
            });
            it('should revert on lock', async () => {
                await expect(vault.lockAsset(lockData)).to.be.revertedWith(
                    'VA:E3',
                );
            });

            it('should revert on unlock', async () => {
                await expect(vault.unlockAsset(lockData)).to.be.revertedWith(
                    'VA:E3',
                );
            });
        });

        describe('when lock/unlock with zero amount', () => {
            before(() => {
                lockData = genLockData(TokenType.Erc20, erc20Token.address);
                lockData.extAmount = 0;
            });
            it('should revert on lock', async () => {
                await expect(vault.lockAsset(lockData)).to.be.revertedWith(
                    'VA:E4',
                );
            });
            it('should revert on unlock', async () => {
                await expect(vault.unlockAsset(lockData)).to.be.revertedWith(
                    'VA:E4',
                );
            });
        });
    });

    function genLockData(tokenType: BigNumber, tokenAddress: string): LockData {
        return {
            tokenType: tokenType,
            token: tokenAddress,
            tokenId: Math.floor(Math.random() * 100),
            extAccount: extAccount.address,
            extAmount: Math.floor(Math.random() * 10000),
        };
    }

    type LockData = {
        tokenType: BigNumber;
        token: string;
        tokenId: number;
        extAccount: string;
        extAmount: number;
    };
});
