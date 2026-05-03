# FlexPass

[![CI](https://img.shields.io/badge/ci-pending-lightgrey.svg)](#)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Polygon](https://img.shields.io/badge/network-Polygon%20PoS-8247e5.svg)](#)

FlexPass is a blockchain-based gym membership system that issues time-bound NFTs
(ERC-4907 + ERC-2981) representing gym access rights. Members can resell unused
membership time through a peer-to-peer secondary market, while gyms receive
on-chain royalties on resale.

## Repository Status

This repository is being implemented from the FlexPass PRD and phased TODO:

- `2025-05-03-flexpass-prd.md`
- `2025-05-03-flexpass-todo.md`

## Planned Packages

- `contracts/` - Solidity contracts and Foundry tests
- `frontend/` - Next.js 14 dApp
- `api/` - Hono Node.js API
- `subgraph/` - The Graph subgraph
- `sdk/` - `@flexpass/verifier` npm SDK
