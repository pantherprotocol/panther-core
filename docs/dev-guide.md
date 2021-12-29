# Development guide

This doc explains how to set up a local development environment for
staking and rewards.

## Prerequisites

- Check out
  [`zkp-staking`](https://github.com/pantherprotocol/zkp-staking) and
  [`zkp-token`](https://github.com/pantherprotocol/zkp-token) repositories.

- Run `yarn` in both.

## Setting up a local blockchain

In `zkp-token`:

- `cp .env.example .env` if you don't already have a suitable `.env`.
- Run `yarn chain` to start a Hardhat Network node.

### Deploying contracts

In `zkp-token`, run `yarn deploy`.
