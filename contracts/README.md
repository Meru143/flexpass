# FlexPass Contracts

The contracts package contains the Polygon PoS implementation for FlexPass. It uses Foundry, Solidity `^0.8.20`, and OpenZeppelin Contracts `5.4.0`.

## Contracts

`GymRegistry.sol` stores gym identity and approval state. The constructor takes `initialOwner`, and the owner can approve or revoke registered gyms. Gym wallets call `registerGym(gymAddress, treasury, name, royaltyBps)` before approval, and approved records are read through `isApproved`, `getGymInfo`, `getTreasury`, `getRoyaltyBps`, `getAllGyms`, and `getApprovedGyms`.

`GymMembership.sol` is the ERC-4907 and ERC-2981 membership NFT. The constructor takes `registryAddress`, `protocolTreasury_`, and `initialOwner`. Approved gyms mint with `mintMembership(to, gymAddress, tierId, durationDays)` or the token URI overload; bulk issuance uses `batchMintMembership`. Access checks read `userOf`, `userExpires`, `getMembershipGym`, and `getMembershipTier`. Marketplace access is granted through `setUserOperator`, and emergency controls use `pause`, `unpause`, and `sweepProtocolFees`.

`FlexPassMarket.sol` is the escrow marketplace. The constructor takes `membershipAddress`, `protocolTreasury_`, and `initialOwner`. Members call `listMembership(tokenId, priceWei)` after approving the market. Buyers call `buyMembership(tokenId)` with the exact listed MATIC value. Sellers can `updatePrice` or `delistMembership`, and anyone can call `cleanExpiredListing` after membership expiry. The market enforces ERC-2981 royalties, pays the protocol fee, restores the ERC-4907 user role after transfer, and emits listing/sale events for the subgraph.

`MembershipLib.sol` defines shared structs and constants used by registry and market code. `IERC4907.sol` and `IGymRegistry.sol` provide typed interfaces for cross-contract calls.

## Build And Test

Run the standard Foundry checks from this directory.

```powershell
forge build
forge test -vvv
forge test --gas-report
forge coverage --report summary
slither src/
```

The current security hardening pass reports 99.12% line coverage. `mintMembership(address,address,uint8,uint256)` averages 183,335 gas, and `buyMembership` averages 115,334 gas.

## Deployment

Set the deployer key, protocol treasury, RPC URL, and explorer API key in the current shell. Do not commit real values to `.env` or any tracked file.

```powershell
$env:DEPLOYER_PRIVATE_KEY = "0x..."
$env:PROTOCOL_TREASURY = "0x..."
$env:AMOY_RPC_URL = "https://polygon-amoy.g.alchemy.com/v2/..."
$env:POLYGONSCAN_API_KEY = "..."
```

Deploy to Polygon Amoy with the full Foundry script command.

```powershell
forge script script/Deploy.s.sol:Deploy `
  --rpc-url $env:AMOY_RPC_URL `
  --private-key $env:DEPLOYER_PRIVATE_KEY `
  --broadcast `
  --verify `
  --etherscan-api-key $env:POLYGONSCAN_API_KEY
```

Deploy to Polygon mainnet by switching the RPC URL.

```powershell
forge script script/Deploy.s.sol:Deploy `
  --rpc-url $env:POLYGON_RPC_URL `
  --private-key $env:DEPLOYER_PRIVATE_KEY `
  --broadcast `
  --verify `
  --etherscan-api-key $env:POLYGONSCAN_API_KEY
```

For local development, run Anvil and seed demo contracts.

```powershell
anvil --chain-id 31337
forge script script/SeedTestData.s.sol --rpc-url http://localhost:8545 --broadcast
```

## Polygon Amoy Addresses

These addresses were deployed on Polygon Amoy at block `37735241`.

| Contract | Address |
| --- | --- |
| GymRegistry | `0xaE12edE4Eab2655b9B1618628c678819693881eA` |
| GymMembership | `0x465CF3a5918534d94BA62F3A7980f5ffB0277168` |
| FlexPassMarket | `0x0e9a4999ABcccE5B1A6989B34Ed549C2Dd72bfC0` |

The matching subgraph manifest uses The Graph network slug `polygon-amoy` and starts indexing from block `37735241`.
