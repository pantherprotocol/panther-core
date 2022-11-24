Panther Protocol: core repository
=================================

This repository contains the heart of the Panther Protocol code:

- [`contracts/`](contracts) - smart contracts:
    - [`staking/`](staking) - contracts for classic and advanced staking
    - [`protocol/`](protocol) - contracts for the MASP (Multi-Asset Shielded Pool)
    - [`common/`](protocol) - shared utility contracts
- [`crypto/`](crypto) - cryptography code
- [`dapp/`](dapp) - the frontend web-based dApp interface
- [`subgraph/`](subgraph) - code for Panther's subgraph on [The Graph](https://thegraph.com/en/)

It does *not* include the zero knowledge circuits, although these will
be published in the future.

Development / testing / contributing
------------------------------------

**Please note:** deployment of this code requires in-depth
understanding of many technical topics including EVM chains, Solidity,
Hardhat, React, TypeScript, The Graph, Zero Knowledge Proofs, and
various other cryptographic techniques.

The development guide in [`docs/dev-guide.md`](docs/dev-guide.md)
explains how to deploy a test environment.  This is currently work in
progress.

Please see [`CONTRIBUTING.md`](CONTRIBUTING.md) and the below
community links for how to contribute.

Community resources
-------------------

Please see the Panther DAO documentation on
[Community](https://docs.pantherprotocol.io/dao/support/community) and
[Other resources](https://docs.pantherprotocol.io/dao/support/other-resources).

Licenses
--------

Please see the top-level [`LICENSE`](LICENSE), other `LICENSE` and
`LICENSE.info` files, and license headers present in many of the
files.  If any files are not explicitly marked as licensed then it
should be assumed that they are unlicensed, i.e. *no* rights are
granted.
