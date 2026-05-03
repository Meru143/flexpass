# FlexPass — Blockchain-Based Gym Membership Portability Protocol
## PRD · 2025-05-03

---

## Section 1 — Project Overview

**Name:** FlexPass  
**Type:** Web3 dApp (Smart Contract Protocol + Next.js Frontend + Subgraph Indexer)  
**Language/Runtime:** Solidity ^0.8.20 (contracts) · TypeScript / Node.js 22 (frontend + backend)  
**License:** MIT  
**Description:**  
FlexPass is a blockchain-based gym membership system that issues time-bound NFTs (ERC-4907 + ERC-2981) representing gym access rights. When a member relocates or can no longer use their gym, they list the unused time on a peer-to-peer secondary market. A buyer acquires the remaining access at a fair market price; the originating gym earns an on-chain royalty on the resale; the seller recoups their sunk cost. No gym chain participation is required beyond initial integration — the contract enforces royalties automatically. Deployed on Polygon PoS for sub-$0.15 transaction fees accessible to everyday fitness consumers.

---

## Section 2 — Problem Statement

- **Non-refundable memberships trap consumers:** Gyms universally enforce no-refund policies. A 12-month membership purchased in January becomes a total loss if the member relocates in March — typically ₹8,000–₹25,000 in unrecoverable value for Indian consumers.
- **Non-transferability is a policy choice, not a technical limitation:** Nothing prevents a gym from allowing membership transfer; they choose not to because forfeited memberships are pure profit. There is no existing mechanism to enforce transferability without gym cooperation.
- **No price discovery for unused gym time:** Even when gyms allow informal transfer, there is no fair market pricing — the seller is always desperate (relocating) and the buyer has all the leverage.
- **Royalty leakage for gyms on secondary markets:** When informal transfers do happen (e.g., passing a card to a friend), the gym receives nothing. A royalty-enforced secondary market actually creates a new revenue stream.
- **Opaque membership state:** Members cannot easily verify what access they hold, when it expires, or what it is worth. There is no standardized on-chain representation of a fitness membership.
- **Multi-gym city-switching friction:** Moving from Mumbai to Pune means cancelling one membership and buying another from scratch — no continuity, no credit, no porting.

---

## Section 3 — Solution

1. **ERC-4907 membership NFTs with expiry:** Each membership is a time-bound NFT with an `expires` timestamp. The NFT encodes the gym address, tier (Standard/Premium), and remaining access window. The `userOf(tokenId)` function is checked at gym entry terminals instead of a plastic card swipe.

2. **Royalty-enforced secondary market (ERC-2981):** The `GymMembership` contract inherits both ERC-4907 and ERC-2981. Royalty is set per gym (default 10%) using `_setTokenRoyalty(tokenId, gymTreasury, 1000)`. Every secondary sale on the FlexPass Marketplace contract enforces payment via `royaltyInfo(tokenId, salePrice)` before transferring ownership.

3. **Peer-to-peer listing marketplace:** A separate `FlexPassMarket` contract allows NFT holders to list, price, and sell unused membership time. Buyers pay in MATIC; royalties flow to the gym treasury address; remaining proceeds go to the seller — all atomically in one transaction.

4. **Verifiable gym registry:** A `GymRegistry` contract stores approved gym addresses, their treasury wallets, tier structures, and royalty rates. Only registry-whitelisted gyms can mint memberships. Prevents impersonation.

5. **Gym entry verification flow:** Gyms integrate a lightweight SDK (REST call to a local verifier node). On entry, the verifier calls `userOf(tokenId)` and `userExpires(tokenId)` on-chain to confirm active access. No QR code infrastructure change needed beyond a one-time tablet/kiosk update.

6. **IPFS-backed metadata:** Each token's metadata (gym name, tier, amenities list, logo) is stored on IPFS via Pinata. `tokenURI(tokenId)` returns a persistent `ipfs://` URI. Metadata is immutable after minting.

7. **The Graph subgraph for fast UI queries:** A custom subgraph indexes `MembershipMinted`, `MembershipListed`, `MembershipSold`, and `UserUpdated` events so the frontend can display a member's full portfolio, transaction history, and live market listings without direct RPC polling.

---

## Section 4 — Target Users

| Persona | Pain Solved | Workflow Improved |
|---|---|---|
| **Gym Member (Relocating)** | Recovers 60–90% of unused membership value | Lists NFT on marketplace, receives MATIC within minutes of sale |
| **Gym Member (Buyer)** | Gets gym access at below-retail price | Browses listings by city/tier, pays once, gets immediate NFT user role |
| **Gym Owner / Chain** | New royalty revenue stream on secondary sales; zero-churn accounting | Receives `royaltyInfo`-enforced MATIC on every resale automatically |
| **Gym Franchise Manager** | Visibility into active membership holder vs. user split | Queries subgraph for current `userOf` per tokenId |
| **Corporate HR / Wellness Programs** | Bulk-issue memberships to employees that are refundable | Mint batch of NFTs; unused ones can be listed back |

---

## Section 5 — Tech Stack Table

| Component | Library | Version | Purpose |
|---|---|---|---|
| Smart Contract Language | Solidity | ^0.8.20 | Contract implementation |
| Contract Standards | OpenZeppelin Contracts | 5.4.0 | ERC-721, ERC-2981, Ownable, Pausable, ReentrancyGuard |
| NFT Standard Extension | ERC-4907 (Double Protocol ref impl) | Final EIP | User/expires roles for time-bound access |
| Dev / Test Framework | Foundry (forge, cast, anvil, chisel) | latest stable | Contract compilation, Solidity-native tests, fuzz testing, local devnet |
| Target Chain | Polygon PoS | mainnet / amoy testnet | ~$0.10 NFT mint, large NFT ecosystem, EVM-compatible |
| Frontend Framework | Next.js | 14.x (App Router) | SSR-capable dApp shell |
| Wallet Connection | RainbowKit | 2.x | Multi-wallet connector UI |
| Web3 React Hooks | Wagmi | 2.x | `useReadContract`, `useWriteContract`, `useAccount` |
| Ethereum Interface | Viem | 2.x | Type-safe ABI encoding, `getContract`, `parseEther` |
| State / Async | TanStack Query | 5.x | Server state for contract reads |
| Metadata Storage | IPFS via Pinata SDK | ^2.1.0 | Immutable `ipfs://` tokenURIs |
| On-chain Indexing | The Graph (subgraph) | latest graph-cli | GraphQL queries over MembershipMinted/Sold/Listed events |
| RPC Provider | Alchemy / Polygon public RPC | — | Reliable read/write node access |
| Backend API | Node.js + Hono | 22.x / 4.x | Gym verification webhook, metadata generation API |
| Database | PostgreSQL 16 + Prisma | 5.x | Gym registry mirror, off-chain metadata cache |
| Contract Deployment | Foundry `forge script` + `.env` | — | Scripted deployments to amoy/mainnet |
| Frontend Styling | Tailwind CSS | 3.x | Utility-first styling |
| Testing (contracts) | Foundry `forge test` | — | Unit + fuzz tests in Solidity |
| Testing (frontend) | Vitest + Testing Library | latest stable | Component and hook tests |
| CI/CD | GitHub Actions | — | Lint, test, deploy on merge |
| Secret Management | Doppler / `.env` + dotenvx | — | RPC keys, Pinata JWT, deployer private key |

### Why Foundry over Hardhat?
Foundry tests run in native Solidity (no JS context switch), compile 2–5× faster, include built-in fuzz testing via `forge test --fuzz-runs`, and have cheat codes (`vm.prank`, `vm.warp`, `vm.expectRevert`) that make testing time-bound membership logic trivial. The `vm.warp(block.timestamp + 30 days)` cheatcode is essential for testing expiry scenarios.

### Why ERC-4907 over a custom time-bound ERC-721?
ERC-4907 is a finalized EIP with a reference implementation by Double Protocol. Its `setUser(tokenId, user, expires)` / `userOf(tokenId)` / `userExpires(tokenId)` interface is already understood by NFT marketplaces and indexers. Rolling a custom standard would require every integration point to re-learn the interface.

### Why Polygon PoS over Base or Arbitrum?
Polygon is the dominant chain for NFT gaming/membership use cases (OpenSea, DraftKings, Magic Eden all run on Polygon). NFT mint costs ~$0.10 vs. ~$0.05 on Base but Polygon's consumer NFT tooling maturity and Indian developer ecosystem familiarity makes it the stronger choice for a fitness-focused product. Polygon's PoS gas model is also friendlier for high-frequency entry verification reads.

### Why ERC-2981 for royalties?
ERC-2981 is the standard royalty interface supported by OpenSea, LooksRare, Blur, and most NFT marketplaces. The `royaltyInfo(tokenId, salePrice)` function returns `(receiver, royaltyAmount)` as a tuple, and the `FlexPassMarket` contract enforces it before every settlement. This is not voluntary — payment is enforced at the smart contract level within the FlexPass ecosystem.

---

## Section 6 — Core Features (v1)

### Feature Group 1 — Gym Registry & Onboarding
- Gym registration via `GymRegistry.registerGym(gymAddress, treasuryAddress, name, tiers[], royaltyBps)` — emits `GymRegistered` event
- Registry owner (multisig) approves/rejects gyms via `approveGym(gymAddress)` / `revokeGym(gymAddress)`
- Tier struct: `{ tierId: uint8, name: string, pricePerMonth: uint256, maxCapacity: uint256 }`
- Gym can update treasury address via `updateTreasury(newTreasury)` — emits `TreasuryUpdated`
- Read: `isApproved(gymAddress)` view function for entry verification

### Feature Group 2 — Membership NFT Minting (ERC-4907 + ERC-2981)
- `GymMembership.mintMembership(to, gymAddress, tierId, durationDays)` — mints ERC-4907 token
- Token metadata: `{ gym, tier, startDate, endDate, amenities[] }` stored on IPFS
- `_setTokenRoyalty(tokenId, gym.treasury, gym.royaltyBps)` called at mint time
- Initial `setUser(tokenId, buyer, expires)` called atomically with mint — buyer is both owner and user at first purchase
- Emits `MembershipMinted(tokenId, gymAddress, tierId, owner, expires)`
- Batch mint support: `batchMintMembership(recipients[], gymAddress, tierId, durationDays)` for corporate bulk purchase
- Gyms pay a protocol fee (1%) on each mint to `FlexPassTreasury`

### Feature Group 3 — Secondary Marketplace
- `FlexPassMarket.listMembership(tokenId, priceWei)` — transfers NFT to escrow, emits `MembershipListed`
- `FlexPassMarket.buyMembership(tokenId)` — pays seller, enforces ERC-2981 royalty to gym treasury, transfers NFT ownership to buyer, calls `setUser(tokenId, buyer, existingExpires)` — emits `MembershipSold`
- `FlexPassMarket.delistMembership(tokenId)` — returns NFT to seller — emits `MembershipDelisted`
- `FlexPassMarket.updatePrice(tokenId, newPriceWei)` — seller can re-price — emits `PriceUpdated`
- Price floor enforced: listing price cannot exceed original mint price (prevents resale above face value by default; togglable by gym)
- Listing auto-expires when `userExpires(tokenId)` is past — anyone can call `cleanExpiredListing(tokenId)`

### Feature Group 4 — Entry Verification SDK
- `VerifierSDK.checkAccess(tokenId)` → calls `userOf(tokenId)` and `userExpires(tokenId)` via Alchemy RPC
- Returns `{ valid: bool, user: address, expiresAt: Date, tierId: uint8, gymAddress: address }`
- SDK available as: npm package `@flexpass/verifier` for Node.js kiosk systems
- QR code flow: Member's wallet generates signed message `{ tokenId, timestamp }` → gym kiosk verifies signature and checks on-chain state
- Offline grace period: if RPC unavailable, SDK accepts locally cached state up to 60 seconds

### Feature Group 5 — Member Dashboard (Frontend)
- Screens: Home / My Memberships / Marketplace / Gym Directory / Transaction History
- My Memberships: lists all tokens where `userOf(tokenId) === connectedAddress`, shows expiry countdown
- Marketplace: browse active listings filtered by city, gym, tier, price range
- Sell flow: select owned membership → enter price → sign `approve` + `listMembership` in one UX step
- Buy flow: select listing → see royalty breakdown → confirm MATIC payment
- Transaction history sourced from The Graph subgraph GraphQL endpoint

### Feature Group 6 — Safety & Guards
- `ReentrancyGuard` on all `FlexPassMarket` functions that transfer value
- `Pausable` on `GymMembership` and `FlexPassMarket` — owner can pause in emergency
- `whenNotExpired` modifier: `require(userExpires(tokenId) > block.timestamp, "Membership expired")`
- Reentrancy protection: checks-effects-interactions pattern enforced throughout marketplace
- Overflow protection: Solidity 0.8.x built-in checked arithmetic
- Access control: `Ownable2Step` (two-step owner transfer to prevent accidental ownership loss)

### Feature Group 7 — Output / Format
- All contract events indexed by The Graph subgraph for <1s query latency
- REST API: `GET /api/membership/:tokenId` → returns off-chain metadata JSON
- REST API: `GET /api/gym/:gymAddress/listings` → returns active marketplace listings
- Webhook: `POST /webhooks/gym-entry` — gym kiosks notify the backend on access events for analytics
- All prices displayed in both MATIC and INR equivalent (using CoinGecko price feed)

---

## Section 7 — Interface Spec

### Smart Contract Interface

```solidity
// GymMembership.sol
function mintMembership(
    address to,
    address gymAddress,
    uint8 tierId,
    uint256 durationDays
) external payable returns (uint256 tokenId);

function batchMintMembership(
    address[] calldata recipients,
    address gymAddress,
    uint8 tierId,
    uint256 durationDays
) external payable returns (uint256[] memory tokenIds);

// Inherited from ERC-4907:
function setUser(uint256 tokenId, address user, uint64 expires) external;
function userOf(uint256 tokenId) external view returns (address);
function userExpires(uint256 tokenId) external view returns (uint256);

// Inherited from ERC-2981:
function royaltyInfo(uint256 tokenId, uint256 salePrice)
    external view returns (address receiver, uint256 royaltyAmount);

// FlexPassMarket.sol
function listMembership(uint256 tokenId, uint256 priceWei) external;
function buyMembership(uint256 tokenId) external payable;
function delistMembership(uint256 tokenId) external;
function updatePrice(uint256 tokenId, uint256 newPriceWei) external;
function cleanExpiredListing(uint256 tokenId) external;

// GymRegistry.sol
function registerGym(
    address gymAddress,
    address treasury,
    string calldata name,
    uint96 royaltyBps
) external;
function approveGym(address gymAddress) external onlyOwner;
function isApproved(address gymAddress) external view returns (bool);
```

### REST API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/membership/:tokenId` | none | Token metadata + on-chain state |
| `GET` | `/api/gym/:address` | none | Gym details + active listing count |
| `GET` | `/api/gym/:address/listings` | none | Active marketplace listings for gym |
| `GET` | `/api/member/:walletAddress` | none | All memberships for wallet |
| `POST` | `/api/gym/register` | gym-signed JWT | Submit gym for registry approval |
| `POST` | `/api/metadata/upload` | server-to-server | Upload token metadata to IPFS, returns ipfs:// URI |
| `POST` | `/webhooks/gym-entry` | HMAC-SHA256 | Gym kiosk entry event |

### The Graph — Subgraph Entities

```graphql
type Membership @entity {
  id: ID!                  # tokenId as string
  gymAddress: Bytes!
  tierId: Int!
  owner: Bytes!
  user: Bytes
  expiresAt: BigInt!
  mintedAt: BigInt!
  currentListing: Listing
  transactions: [MembershipTransaction!]! @derivedFrom(field: "membership")
}

type Listing @entity {
  id: ID!                  # tokenId
  seller: Bytes!
  priceWei: BigInt!
  listedAt: BigInt!
  active: Boolean!
}

type MembershipTransaction @entity {
  id: ID!                  # txHash-logIndex
  type: String!            # "mint" | "list" | "buy" | "delist"
  membership: Membership!
  from: Bytes!
  to: Bytes
  priceWei: BigInt
  royaltyPaid: BigInt
  timestamp: BigInt!
}
```

### Frontend Screens

| Screen | Key Interactions |
|---|---|
| `/` Home | Hero with connect wallet CTA; stats ticker (total memberships, active listings, gyms) |
| `/dashboard` My Memberships | Lists user's tokens via subgraph; expiry badges; "Sell" CTA per token |
| `/marketplace` Browse | Filter by city / gym / tier / price; pagination; "Buy" modal with breakdown |
| `/gym/:address` Gym Page | Gym info; active listings; "Buy New Membership" |
| `/sell/:tokenId` Sell Flow | Price input; royalty preview; `approve` + `listMembership` 2-step tx |
| `/buy/:tokenId` Buy Flow | Listing details; royalty/fee breakdown; single `buyMembership` tx |

---

## Section 8 — Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         FlexPass Data Flow                               │
└──────────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐     register + approve      ┌─────────────────────┐
  │   Gym Owner  │ ──────────────────────────▶ │   GymRegistry.sol   │
  └─────────────┘                              └─────────┬───────────┘
                                                         │ isApproved()
  ┌─────────────┐   mintMembership(to,gym,tier)          ▼
  │    Member   │ ──────────────────────────▶ ┌──────────────────────┐
  │  (Buyer)   │                              │  GymMembership.sol   │
  └─────────────┘                             │  ERC-4907 + ERC-2981 │
                                              └────────┬─────────────┘
                                                       │ setUser(id,buyer,exp)
                    ┌──────────────────────────────────▼────────────────┐
                    │              Polygon PoS Chain                     │
                    │  tokenId → { owner, user, expires, royaltyInfo }  │
                    └──────────┬─────────────────────────────┬──────────┘
                               │ Events emitted               │ RPC reads
                    ┌──────────▼──────────┐       ┌──────────▼──────────┐
                    │  The Graph Subgraph  │       │   Alchemy RPC Node   │
                    │  AssemblyScript maps │       │ (entry verification) │
                    │  → GraphQL entities  │       └──────────┬──────────┘
                    └──────────┬──────────┘                  │
                               │ GraphQL queries    ┌────────▼────────────┐
                    ┌──────────▼──────────┐         │  @flexpass/verifier  │
                    │  Next.js Frontend   │         │  SDK (npm package)   │
                    │  Wagmi + RainbowKit │◀────────┤  gym kiosk reads     │
                    │  Dashboard / Market │         └─────────────────────┘
                    └──────────┬──────────┘
                               │ listMembership() / buyMembership()
                    ┌──────────▼──────────┐
                    │  FlexPassMarket.sol  │
                    │  escrow + royalty    │◀──── seller lists NFT
                    │  enforcement         │
                    └──────────┬──────────┘
                               │ royaltyInfo(id, price) → gym treasury
                    ┌──────────▼──────────────────────────┐
                    │  MATIC flows:                        │
                    │  buyer.value → seller (net)          │
                    │              → gym treasury (royalty)│
                    │              → protocol (1% fee)     │
                    └─────────────────────────────────────┘
```

---

## Section 9 — Architecture / Package Structure

```
flexpass/
├── contracts/                          # Foundry project root
│   ├── foundry.toml                    # Foundry config: solc version, optimizer, remappings
│   ├── remappings.txt                  # @openzeppelin → lib/openzeppelin-contracts/
│   ├── lib/
│   │   ├── openzeppelin-contracts/     # git submodule: v5.4.0
│   │   └── erc4907/                    # git submodule: Double Protocol ERC-4907 ref impl
│   ├── src/
│   │   ├── GymRegistry.sol             # Approved gym whitelist + tier registry
│   │   ├── GymMembership.sol           # ERC-4907 + ERC-2981 membership NFT
│   │   ├── FlexPassMarket.sol          # P2P marketplace with royalty enforcement
│   │   ├── interfaces/
│   │   │   ├── IERC4907.sol            # ERC-4907 interface (setUser, userOf, userExpires)
│   │   │   ├── IGymRegistry.sol        # Registry read interface for other contracts
│   │   │   └── IFlexPassMarket.sol     # Market interface for SDK consumers
│   │   └── libraries/
│   │       └── MembershipLib.sol       # Shared structs: MembershipInfo, Listing, GymInfo
│   ├── script/
│   │   ├── Deploy.s.sol                # Deployment script: registry → membership → market
│   │   └── SeedTestData.s.sol          # Seed anvil with test gyms + memberships
│   └── test/
│       ├── GymRegistry.t.sol           # Unit tests: register, approve, revoke
│       ├── GymMembership.t.sol         # Unit tests: mint, setUser, expiry, royaltyInfo
│       ├── FlexPassMarket.t.sol        # Unit tests: list, buy, delist, royalty flow
│       ├── Fuzz.t.sol                  # Fuzz: random price/duration/address combos
│       └── Integration.t.sol           # End-to-end: mint → list → buy → entry verify
│
├── frontend/                           # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx                  # Root layout with WagmiProvider + RainbowKitProvider
│   │   ├── providers.tsx               # QueryClient + WagmiProvider + RainbowKitProvider
│   │   ├── page.tsx                    # Home / landing
│   │   ├── dashboard/page.tsx          # My Memberships
│   │   ├── marketplace/page.tsx        # Browse listings
│   │   ├── sell/[tokenId]/page.tsx     # Sell flow
│   │   ├── buy/[tokenId]/page.tsx      # Buy flow
│   │   └── gym/[address]/page.tsx      # Gym detail page
│   ├── components/
│   │   ├── MembershipCard.tsx          # NFT card: gym name, tier, expiry countdown
│   │   ├── ListingCard.tsx             # Marketplace listing card
│   │   ├── RoyaltyBreakdown.tsx        # Shows seller net / gym royalty / protocol fee
│   │   ├── ConnectButton.tsx           # Wraps RainbowKit ConnectButton
│   │   └── ExpiryCountdown.tsx         # Live countdown timer from userExpires
│   ├── hooks/
│   │   ├── useMemberships.ts           # Queries subgraph for user's tokens
│   │   ├── useListings.ts              # Queries subgraph for marketplace listings
│   │   ├── useBuyMembership.ts         # useWriteContract wrapper for buyMembership()
│   │   ├── useListMembership.ts        # approve + listMembership 2-step hook
│   │   └── useRoyaltyInfo.ts           # useReadContract for royaltyInfo(tokenId, price)
│   ├── lib/
│   │   ├── wagmi.ts                    # getDefaultConfig with Polygon + amoy chains
│   │   ├── subgraph.ts                 # GraphQL client for The Graph endpoint
│   │   ├── contracts.ts                # Contract addresses + ABIs per chain
│   │   └── formatters.ts               # formatMATIC, maticToINR, formatExpiry
│   ├── public/
│   └── package.json
│
├── api/                                # Hono Node.js API server
│   ├── src/
│   │   ├── index.ts                    # Hono app entry, route registration
│   │   ├── routes/
│   │   │   ├── membership.ts           # GET /membership/:tokenId
│   │   │   ├── gym.ts                  # GET /gym/:address, POST /gym/register
│   │   │   ├── metadata.ts             # POST /metadata/upload → Pinata → ipfs://
│   │   │   └── webhooks.ts             # POST /webhooks/gym-entry
│   │   ├── services/
│   │   │   ├── pinata.ts               # Pinata SDK: uploadJSON, getMetadata
│   │   │   ├── onchain.ts              # Viem publicClient: readContract calls
│   │   │   └── priceFeed.ts            # CoinGecko: MATIC/INR rate
│   │   └── db/
│   │       ├── schema.prisma           # Gym, MembershipCache, EntryEvent models
│   │       └── client.ts               # Prisma client singleton
│   └── package.json
│
├── subgraph/                           # The Graph subgraph
│   ├── subgraph.yaml                   # Manifest: dataSources for all 3 contracts
│   ├── schema.graphql                  # Membership, Listing, MembershipTransaction
│   └── src/
│       └── mappings.ts                 # AssemblyScript event handlers
│
├── sdk/                                # @flexpass/verifier npm package
│   ├── src/
│   │   ├── index.ts                    # checkAccess(tokenId), getExpiry(tokenId)
│   │   └── types.ts                    # AccessResult, VerifierConfig
│   └── package.json
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                      # Lint + forge test + vitest on PR
│   │   └── deploy.yml                  # Deploy contracts + subgraph on tag
│   └── PULL_REQUEST_TEMPLATE.md
└── Makefile                            # make test, make deploy-amoy, make subgraph-deploy
```

### Key Solidity Types

```solidity
// MembershipLib.sol

struct GymInfo {
    address gymAddress;
    address treasury;
    string  name;
    uint96  royaltyBps;      // 1000 = 10%
    bool    approved;
    Tier[]  tiers;
}

struct Tier {
    uint8   tierId;
    string  name;
    uint256 pricePerMonth;   // in wei (MATIC)
    uint256 maxCapacity;
}

struct Listing {
    uint256 tokenId;
    address seller;
    uint256 priceWei;
    uint256 listedAt;
    bool    active;
}

struct MembershipInfo {
    uint256 tokenId;
    address gymAddress;
    uint8   tierId;
    uint64  expiresAt;       // unix timestamp (matches ERC-4907 uint64)
    address owner;
    address user;
}
```

---

## Section 10 — Error Handling

### Error Scenarios

- Attempt to mint membership from unregistered/unapproved gym
- Buyer sends insufficient MATIC (`msg.value < listing.priceWei`)
- Attempt to list an expired membership (`userExpires(tokenId) <= block.timestamp`)
- Attempt to buy a delisted or already-sold listing
- Non-owner attempting to call `setUser` directly
- Royalty calculation overflow (salePrice × royaltyBps exceeds uint256 — practically impossible but guarded)
- IPFS metadata upload failure during mint (frontend must handle and retry)
- RPC node unreachable during entry verification (SDK offline grace period)

### Error Codes

| Code | Meaning | Action |
|---|---|---|
| `GR_NOT_APPROVED` | Gym not in approved registry | Reject mint; show "Gym not yet on FlexPass" |
| `GM_ZERO_DURATION` | `durationDays == 0` passed to mint | Revert with explicit message |
| `GM_EXPIRED` | Membership already past expiry | Block listing; show expiry date to user |
| `GM_NOT_OWNER` | Caller is not NFT owner | Revert; frontend should disable sell button |
| `MKT_WRONG_VALUE` | `msg.value != listing.priceWei` | Revert; frontend refreshes price before submit |
| `MKT_INACTIVE` | Listing not active or already sold | Revert; frontend polls listing status |
| `MKT_SELF_BUY` | Buyer is same as seller | Revert; frontend disables Buy for own listings |
| `MKT_PRICE_EXCEEDS_FLOOR` | Listing above original mint price | Revert if gym has floor enabled |

### User-Facing Messages (exact strings)

```
"This gym is not yet registered on FlexPass."
"Your membership expired on {date}. It cannot be listed."
"Someone just bought this listing. Refreshing..."
"Insufficient MATIC. You need {amount} MATIC to buy this membership."
"You cannot buy your own listing."
"Transaction failed — please try again."
```

---

## Section 11 — Edge Cases

1. **Listing an expiring-soon membership:** The buyer might receive a token with only 3 days left. UI must prominently display expiry. Contract does not block short-duration listings — this is the buyer's responsibility.

2. **Transfer clears user role:** When ERC-721 `transferFrom` is called (e.g., on marketplace buy), the ERC-4907 reference implementation clears `_users[tokenId]`. The `FlexPassMarket.buyMembership()` must call `setUser(tokenId, buyer, existingExpires)` *after* transfer in the same transaction.

3. **Royalty denominator:** ERC-2981 uses 10000 as denominator by default. A 10% royalty is `royaltyBps = 1000`. Gym operators setting `royaltyBps = 10000` (100%) must be blocked — cap enforced at `maxRoyaltyBps = 3000` (30%).

4. **Multiple listings of same token:** ERC-721 approval is per-address, not per-listing. If user calls `approve(market, tokenId)`, then `listMembership`, then transfers the token manually — the listing becomes orphaned. Market contract must re-check `ownerOf(tokenId) == listing.seller` before `buyMembership` proceeds.

5. **Chain reorg:** The Graph subgraph may briefly show stale listing state after a reorg. Frontend should show a "refreshing" state for 15 seconds after any write transaction.

6. **Corporate bulk minting with different recipients:** `batchMintMembership` sets `owner = recipient` and `user = recipient` for each. If recipient wallet has never interacted with Polygon, they may need MATIC for gas to re-list. Consider meta-transactions (EIP-2771) for gasless listing as v2 feature.

7. **Gym treasury address changes after tokens are minted:** ERC-2981 `_tokenRoyalty[tokenId].receiver` is set at mint time. Subsequent gym treasury updates via `updateTreasury()` only affect *future* mints — historical tokens still pay the old treasury. Document this clearly for gym owners.

8. **Zero-address user after expiry:** ERC-4907 spec: if `block.timestamp > expires`, `userOf(tokenId)` returns `address(0)`. Entry verification SDK must treat `address(0)` as no access granted.

9. **Price in MATIC vs INR volatility:** A listing placed at 100 MATIC when MATIC = ₹80 is worth ₹8,000. If MATIC drops to ₹40, the listing becomes ₹4,000. UI should show both MATIC and approximate INR with a volatility disclaimer.

10. **ERC-2981 not enforced by external marketplaces:** If user lists their FlexPass NFT on OpenSea directly (bypassing `FlexPassMarket`), royalties are not guaranteed. Mitigation: implement `_beforeTokenTransfer` to block transfers unless routed through `FlexPassMarket` or explicitly approved by gym (operator allowlist pattern). This is a philosophical tradeoff for v1 — document limitation.

---

## Section 12 — Testing Strategy

### Unit Tests (Foundry)
- Mock `GymRegistry` as a stub contract in membership tests
- Test `mintMembership` with various duration values (0, 1, 365, 3650 days)
- Test `userOf` before and after `vm.warp(block.timestamp + duration + 1)` (expiry)
- Test `royaltyInfo(tokenId, salePrice)` returns correct `(receiver, amount)` tuple
- Test `listMembership` reverts when called by non-owner
- Test `buyMembership` correctly distributes MATIC to seller, gym treasury, and protocol
- Test `cleanExpiredListing` callable by anyone after expiry

### Integration Tests (Foundry, anvil fork)
- Deploy all three contracts in `setUp()` with `vm.createSelectFork("polygon")`
- Mint a membership, list it, buy it in sequence — assert all balances
- Test reentrancy guard: mock attacker contract that calls `buyMembership` recursively
- Test `Pausable`: pause market, verify `buyMembership` reverts, unpause, verify success

### E2E Tests (Vitest + Viem on anvil)
- Start local `anvil` node, deploy contracts, run frontend hooks against local RPC
- Test `useListMembership` hook: approve tx + list tx both submitted in sequence
- Test subgraph mock: stub GraphQL responses, verify `useMemberships` correctly transforms data

---

## Section 13 — Distribution

### Contract Deployment

```bash
# Testnet (Polygon Amoy)
forge script script/Deploy.s.sol \
  --rpc-url $AMOY_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast --verify --etherscan-api-key $POLYGONSCAN_API_KEY

# Mainnet
forge script script/Deploy.s.sol \
  --rpc-url $POLYGON_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast --verify --etherscan-api-key $POLYGONSCAN_API_KEY
```

### Subgraph Deployment

```bash
graph codegen && graph build
graph deploy --studio flexpass
```

### Frontend (Vercel)

```bash
vercel deploy --prod
```

### SDK (npm)

```bash
npm publish --access public   # publishes @flexpass/verifier
```

---

## Section 14 — Differentiators

1. **vs. ClassPass / Urban Company:** These are centralized aggregators that negotiate with gyms on your behalf. FlexPass is trustless — once a gym registers, royalties and transfers are enforced by the contract with no platform intervention required.

2. **vs. Gym's native app loyalty points:** Loyalty points are non-transferable, chain-specific, and expire without recourse. FlexPass NFTs are wallet-portable, chain-interoperable, and resellable.

3. **vs. Generic NFT ticketing platforms (GET Protocol, YellowHeart):** These focus on events (concerts, sports). FlexPass is purpose-built for recurring time-based access (weekly/monthly gym visits), with an entry verification SDK designed for turnstile/kiosk hardware integration.

4. **vs. Selling a gym membership informally (WhatsApp group):** No price discovery, no trust, no royalty to gym, no on-chain proof of transfer. FlexPass provides atomic settlement with royalty enforcement.

5. **vs. Building ERC-721 from scratch:** Custom time-bound NFT would require every integration (OpenSea, wallet, indexer) to re-learn the interface. ERC-4907 is a finalized EIP with existing tooling support.

---

## Section 15 — Future Scope (v2+)

- [ ] **Multi-gym city pass:** Mint a single "City Pass" NFT usable across a network of registered FlexPass gyms in one metro
- [ ] **Fractional membership time:** ERC-1155 variant where 1 token = 1 day of access; bulk transfer = sell N days
- [ ] **Gasless listing via EIP-2771 meta-transactions:** Relayer covers listing gas for new users
- [ ] **Cross-chain bridge:** Port Polygon PoS memberships to Base or Arbitrum via CCIP
- [ ] **Gym discovery map:** Leaflet.js/Mapbox map of all FlexPass-registered gyms with live listings
- [ ] **Membership lending (ERC-4907 full usage):** Owner retains NFT but grants `user` role to a friend for 30 days without selling
- [ ] **Corporate wellness integration:** HR systems can mint batch memberships for employees via payroll webhook
- [ ] **On-chain reviews:** Members who held a `userOf` role for >30 days can submit a cryptographically signed review
- [ ] **Subscription auto-renewal:** Chainlink Automation triggers monthly `mintMembership` if member pre-approves

---

## Section 16 — Success Metrics

- [ ] 10 gyms registered and approved on Polygon mainnet within 90 days of launch
- [ ] 500 membership NFTs minted in first 60 days
- [ ] 100 secondary market sales in first 90 days
- [ ] Average resale price ≥ 70% of original mint price (validates the value recovery thesis)
- [ ] Gym royalty revenue: at least 3 gyms receiving on-chain royalty payments within 60 days
- [ ] Entry verification SDK: ≥3 gym kiosks using `@flexpass/verifier` in production
- [ ] Frontend page load: Lighthouse performance score ≥ 90 on `/marketplace`
- [ ] Contract audit: zero critical or high severity findings before mainnet
- [ ] Test coverage: ≥ 90% line coverage on all contracts (`forge coverage`)
- [ ] Subgraph sync lag: ≤ 5 blocks behind chain tip under normal conditions
- [ ] The Graph query response time: ≤ 500ms for standard `useMemberships` query

---

## Section 17 — Additional Deliverables

### Documentation Files
- [ ] `README.md` — architecture overview, quick start, contract addresses by network
- [ ] `CONTRIBUTING.md` — branch strategy, PR guidelines, test requirements
- [ ] `CODE_OF_CONDUCT.md` — Contributor Covenant v2.1
- [ ] `SECURITY.md` — responsible disclosure contact, audit reports link
- [ ] `contracts/README.md` — contract architecture, deployment guide
- [ ] `sdk/README.md` — verifier SDK usage guide with code examples
- [ ] `.github/ISSUE_TEMPLATE/bug_report.yml`
- [ ] `.github/ISSUE_TEMPLATE/feature_request.yml`
- [ ] `.github/PULL_REQUEST_TEMPLATE.md`

### Development Environment Files
- [ ] `devcontainer/Dockerfile` — Foundry + Node.js 22 + graph-cli in one container
- [ ] `docker-compose.dev.yml` — PostgreSQL 16 + local graph-node + anvil in compose
- [ ] `.env.example` — all required environment variables with placeholder values
- [ ] `Makefile` — `test`, `deploy-amoy`, `deploy-mainnet`, `subgraph-build`, `sdk-publish`

### Logging & Observability
- [ ] Contract event emission for all state changes (already specified in Section 6)
- [ ] API server structured JSON logging via `pino` with `requestId`, `chainId`, `tokenId` fields
- [ ] Sentry error tracking on frontend and API server
- [ ] Grafana dashboard for: mint volume, listing count, avg resale price (sourced from The Graph)

### Performance Targets
- [ ] `forge test` full suite: < 30 seconds on CI
- [ ] `buyMembership` gas usage: < 120,000 gas
- [ ] `mintMembership` gas usage: < 200,000 gas
- [ ] Frontend TTFB (Next.js static generation): < 200ms
- [ ] Subgraph indexing: < 2 blocks behind tip

### Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `POLYGON_RPC_URL` | Alchemy/Infura mainnet RPC | none — required |
| `AMOY_RPC_URL` | Polygon Amoy testnet RPC | none — required |
| `DEPLOYER_PRIVATE_KEY` | Contract deployer private key | none — required |
| `POLYGONSCAN_API_KEY` | Contract verification | none — required |
| `PINATA_JWT` | IPFS metadata upload auth | none — required |
| `GRAPH_STUDIO_DEPLOY_KEY` | The Graph subgraph deploy key | none — required |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | RainbowKit/WalletConnect | none — required |
| `NEXT_PUBLIC_SUBGRAPH_URL` | The Graph endpoint | none — required |
| `NEXT_PUBLIC_CHAIN_ID` | 137 (mainnet) / 80002 (amoy) | `80002` |
| `NEXT_PUBLIC_GYM_MEMBERSHIP_ADDRESS` | Deployed contract address | none |
| `NEXT_PUBLIC_MARKET_ADDRESS` | Deployed market contract address | none |
| `DATABASE_URL` | Prisma PostgreSQL connection string | none — required |
| `COINGECKO_API_KEY` | MATIC/INR price feed | none — optional |
| `WEBHOOK_HMAC_SECRET` | Gym kiosk webhook verification | none — required |

---

## Section 18 — Expanded Testing Strategy

### Unit Tests (target: 90%+ line coverage)
- [ ] `GymRegistry`: `registerGym` emits `GymRegistered` event
- [ ] `GymRegistry`: `approveGym` only callable by owner
- [ ] `GymRegistry`: `isApproved` returns false before approval, true after
- [ ] `GymRegistry`: `revokeGym` sets approved = false; mints revert after revocation
- [ ] `GymMembership`: `mintMembership` reverts for unapproved gym
- [ ] `GymMembership`: `mintMembership` with `durationDays = 0` reverts with `GM_ZERO_DURATION`
- [ ] `GymMembership`: `userOf(tokenId)` returns buyer address immediately after mint
- [ ] `GymMembership`: `userExpires(tokenId)` returns `block.timestamp + durationDays * 86400`
- [ ] `GymMembership`: after `vm.warp(expires + 1)`, `userOf(tokenId)` returns `address(0)`
- [ ] `GymMembership`: `royaltyInfo(tokenId, 100 ether)` returns `(gymTreasury, 10 ether)` for 10% royalty
- [ ] `GymMembership`: `batchMintMembership` assigns correct owner/user for each recipient
- [ ] `GymMembership`: `Pausable` — mint reverts when paused
- [ ] `FlexPassMarket`: `listMembership` succeeds when caller is owner
- [ ] `FlexPassMarket`: `listMembership` reverts when membership is expired
- [ ] `FlexPassMarket`: `listMembership` reverts when caller is not owner
- [ ] `FlexPassMarket`: `buyMembership` transfers correct MATIC to seller and gym treasury
- [ ] `FlexPassMarket`: `buyMembership` sets `userOf(tokenId)` to buyer
- [ ] `FlexPassMarket`: `buyMembership` reverts with `MKT_SELF_BUY` when buyer is seller
- [ ] `FlexPassMarket`: `buyMembership` reverts with `MKT_WRONG_VALUE` on wrong MATIC amount
- [ ] `FlexPassMarket`: `delistMembership` returns NFT to seller, marks listing inactive
- [ ] `FlexPassMarket`: `cleanExpiredListing` callable by anyone after expiry
- [ ] `FlexPassMarket`: `ReentrancyGuard` — reentrancy attack reverts

### Integration Tests
- [ ] Full flow: register gym → approve → mint → list → buy → verify `userOf` = new buyer
- [ ] Royalty split: verify seller balance, gym treasury balance, protocol fee address balance after buy
- [ ] Ownership check in `buyMembership`: transfer token out of escrow manually, verify buy reverts
- [ ] Pause/unpause: pause market → buy reverts → unpause → buy succeeds

### E2E Tests
- [ ] Connect wallet → view empty dashboard → receive minted membership → dashboard shows it
- [ ] List membership → marketplace shows listing → disconnect → reconnect as buyer → buy → both dashboards update

### Test Infrastructure
- [ ] `anvil` fork of Polygon mainnet for integration tests
- [ ] `forge install openzeppelin-contracts --no-commit`
- [ ] GitHub Actions matrix: `ubuntu-latest`, Foundry `stable`
- [ ] Coverage report via `forge coverage --report lcov` uploaded to Codecov

---

## Section 19 — CI/CD Pipeline

### GitHub Actions — CI (`.github/workflows/ci.yml`)
- [ ] Trigger: push to `main`, all pull requests
- [ ] Job: Lint Solidity with `forge fmt --check`
- [ ] Job: Unit tests with `forge test -vvv`
- [ ] Job: Fuzz tests with `forge test --fuzz-runs 1000`
- [ ] Job: Coverage with `forge coverage --report lcov`, fail if < 90%
- [ ] Job: Frontend lint with `eslint` + `tsc --noEmit`
- [ ] Job: Frontend unit tests with `vitest run`
- [ ] Job: Build check `next build`

### GitHub Actions — Release (`.github/workflows/deploy.yml`)
- [ ] Trigger: tag push `v*`
- [ ] Job: Deploy contracts to Polygon Amoy (testnet) and verify on Polygonscan
- [ ] Job: Deploy subgraph to The Graph Studio
- [ ] Job: Deploy frontend to Vercel
- [ ] Job: Publish `@flexpass/verifier` to npm

### Makefile Targets
- [ ] `make test` — `forge test -vvv`
- [ ] `make coverage` — `forge coverage --report lcov`
- [ ] `make fmt` — `forge fmt`
- [ ] `make deploy-amoy` — `forge script Deploy.s.sol --rpc-url $AMOY_RPC_URL ...`
- [ ] `make deploy-mainnet` — `forge script Deploy.s.sol --rpc-url $POLYGON_RPC_URL ...`
- [ ] `make subgraph-build` — `graph codegen && graph build`
- [ ] `make subgraph-deploy` — `graph deploy --studio flexpass`
- [ ] `make sdk-publish` — `cd sdk && npm publish`

### Security & Code Quality
- [ ] Slither static analysis on all contracts (`slither src/`) — zero high/medium findings
- [ ] `solhint` linting with `solhint:recommended` rules
- [ ] Dependabot enabled for npm and GitHub Actions
- [ ] Branch protection: require PR approval + CI green before merge to `main`
