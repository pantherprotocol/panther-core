// SPDX-License-Identifier: MIT

const hre = require("hardhat")
const { waffle } = hre
// const { deployContract } = waffle

import ethers from "ethers"
import { expect } from "chai"

import {
    genRandomSalt,
    NOTHING_UP_MY_SLEEVE,
    IncrementalQuinTree,
} from 'maci-crypto'
import { loadAB, linkPoseidonContracts } from "../lib/deploy"

let PoseidonT3 = require('../compiled/PoseidonT3.json')

let accounts
let deployer
let mtContract: ethers.Contract
let crContract: ethers.Contract
let PoseidonT3Contract

const DEPTH = 32

let tree: IncrementalQuinTree

describe('IncrementalMerkleTree', () => {
    beforeAll(async () => {
        accounts = await hre.ethers.getSigners()
        deployer = await ethers.getContractFactory("PoseidonT3")

        console.log('Deploying PoseidonT3Contract')
        PoseidonT3Contract = await deployer.deploy(PoseidonT3.abi, PoseidonT3.bytecode, {})

        // Link Poseidon contracts
        linkPoseidonContracts(
            ['IncrementalMerkleTree.sol', 'ComputeRoot.sol'],
            PoseidonT3Contract.address,
            PoseidonT6Contract.address,
        )

        const [ IncrementalMerkleTreeAbi, IncrementalMerkleTreeBin ] = loadAB('IncrementalMerkleTree')
        console.log('Deploying IncrementalMerkleTree')
        mtContract = await deployer.deploy(
            IncrementalMerkleTreeAbi,
            IncrementalMerkleTreeBin,
            DEPTH,
            NOTHING_UP_MY_SLEEVE.toString(),
            false,
        )

        const [ ComputeRootAbi, ComputeRootBin ] = loadAB('ComputeRoot')
        console.log('Deploying ComputeRoot')
        crContract = await deployer.deploy(
            ComputeRootAbi,
            ComputeRootBin,
        )

        tree = new IncrementalQuinTree(DEPTH, NOTHING_UP_MY_SLEEVE, 2)
    })

    it('an empty tree should have the correct root', async () => {
        const root1 = await mtContract.root()
        expect(tree.root.toString()).to.equal(root1.toString())
    })

    it('computeEmptyRoot() should generate the correct root', async () => {
        const emptyRoot = await crContract.computeEmptyRoot(DEPTH, NOTHING_UP_MY_SLEEVE.toString())
        expect(tree.root.toString()).to.equal(emptyRoot.toString())
    })

    it('the on-chain root should match an off-chain root after various insertions', async () => {
        expect.assertions(8)
        for (let i = 0; i < 8; i++) {
            const leaf = genRandomSalt()

            const tx = await mtContract.insertLeaf(leaf.toString())
            await tx.wait()
            const root1 = await mtContract.root()

            tree.insert(leaf)

            expect(tree.root.toString()).to.equal(root1.toString())
        }
    })
})
