<!--
Phase 0 Skills Verification

Installed active skills:
- javascript-testing-patterns
- web-design-guidelines
- frontend-design
- ui-ux-pro-max
- accessibility-a11y
- api-design-principles
- supabase-postgres-best-practices
- test-driven-development
- systematic-debugging
- devops-engineer
- e2e-testing-patterns
- architecture-patterns
- error-handling-patterns
- git-commit

Missing requested active skills:
- typescript-pro
- playwright-cli

| Phase | Skills to activate |
|---|---|
| Phase 1: Project Setup | `git-commit`, `devops-engineer` |
| Phase 2: Smart Contract — Shared Library | `architecture-patterns`, `error-handling-patterns` |
| Phase 3: Smart Contract — GymRegistry.sol | `architecture-patterns`, `error-handling-patterns` |
| Phase 4: Smart Contract — GymMembership.sol | `architecture-patterns`, `error-handling-patterns` |
| Phase 5: Smart Contract — FlexPassMarket.sol | `architecture-patterns`, `error-handling-patterns` |
| Phase 6: Deployment Scripts | `devops-engineer` |
| Phase 7: Foundry Tests | `test-driven-development`, `systematic-debugging` |
| Phase 8: Subgraph Implementation | `architecture-patterns`, `typescript-pro` |
| Phase 9: API Server | `api-design-principles`, `typescript-pro`, `supabase-postgres-best-practices`, `error-handling-patterns` |
| Phase 10: Frontend Components | `typescript-pro`, `frontend-design`, `web-design-guidelines`, `ui-ux-pro-max`, `accessibility-a11y`, `javascript-testing-patterns` |
| Phase 11: SDK — @flexpass/verifier | `typescript-pro`, `api-design-principles` |
| Phase 12: CI/CD Pipeline | `devops-engineer`, `git-commit` |
| Phase 13: Security Hardening | `systematic-debugging`, `error-handling-patterns`, `test-driven-development` |
| Phase 14: Documentation & Community | (technical-writing standards) |
-->

# FlexPass — Detailed Phased TODO
## 2025-05-03

---

## Phase 1: Project Setup

### 1.1 Repository Initialization
- [x] Create GitHub repo `flexpass` with MIT license
- [x] Add top-level `README.md` with project overview and badge placeholders
- [x] Add `CHANGELOG.md` with `## [Unreleased]` section
- [x] Add `.gitignore` covering `node_modules/`, `.env*`, `out/`, `cache/`, `.next/`, `dist/`
- [x] Add `.editorconfig` with `indent_size = 2`, `end_of_line = lf`, `insert_final_newline = true`
- [x] Create monorepo folder structure: `contracts/`, `frontend/`, `api/`, `subgraph/`, `sdk/`
- [x] Add root-level `Makefile` with stub targets
- [x] Create `.github/workflows/ci.yml` stub file
- [x] Create `.github/workflows/deploy.yml` stub file
- [x] Create `.github/PULL_REQUEST_TEMPLATE.md`
- [x] Create `.github/ISSUE_TEMPLATE/bug_report.yml`
- [x] Create `.github/ISSUE_TEMPLATE/feature_request.yml`

### 1.2 Foundry Project Setup (`contracts/`)
- [x] `cd contracts && forge init --no-commit` to initialize Foundry project
- [x] Set `foundry.toml`: `solc = "0.8.20"`, `optimizer = true`, `optimizer_runs = 200`, `fuzz_runs = 256`
- [x] Add `foundry.toml` `[profile.ci]` section: `fuzz_runs = 1000`
- [x] Install OpenZeppelin v5 as git submodule: `forge install OpenZeppelin/openzeppelin-contracts@v5.4.0 --no-commit`
- [x] Create `remappings.txt`: add `@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/`
- [x] Create `src/` directory structure: `src/`, `src/interfaces/`, `src/libraries/`
- [x] Create `script/` directory
- [x] Create `test/` directory
- [x] Delete Foundry scaffold `src/Counter.sol` and `test/Counter.t.sol`
- [x] Confirm `forge build` succeeds on empty project

### 1.3 Frontend Project Setup (`frontend/`)
- [x] `cd frontend && npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir no`
- [x] Install dependencies: `npm i wagmi@2 viem@2 @rainbow-me/rainbowkit@2 @tanstack/react-query@5`
- [x] Install dev dependencies: `npm i -D vitest @testing-library/react @testing-library/jest-dom`
- [x] Create `app/providers.tsx` with `WagmiProvider`, `QueryClientProvider`, `RainbowKitProvider` wrapper
- [x] Import `@rainbow-me/rainbowkit/styles.css` in `app/layout.tsx`
- [x] Wrap `app/layout.tsx` body with `<Providers>`
- [x] Create `lib/wagmi.ts` with `getDefaultConfig({ appName: 'FlexPass', chains: [polygon, polygonAmoy] })`
- [x] Add `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` to `.env.local` (WalletConnect Cloud project ID)
- [x] Confirm `next dev` starts without errors

### 1.4 API Project Setup (`api/`)
- [x] `cd api && npm init -y`
- [x] Install: `npm i hono @hono/node-server prisma @prisma/client pinata viem pino`
- [x] Install dev: `npm i -D typescript @types/node ts-node nodemon`
- [x] Create `src/index.ts` with basic `Hono` app and `serve()` call
- [x] Create `tsconfig.json` with `"module": "ESNext"`, `"target": "ES2022"`, `"strict": true`
- [x] Initialize Prisma: `npx prisma init --datasource-provider postgresql`
- [x] Create `src/db/client.ts` with `PrismaClient` singleton

### 1.5 Subgraph Project Setup (`subgraph/`)
- [x] Install graph-cli: `npm i -g @graphprotocol/graph-cli`
- [x] `cd subgraph && graph init --protocol ethereum --from-contract <placeholder> flexpass`
- [x] Create `schema.graphql` stub with empty `Membership` entity
- [x] Create `subgraph.yaml` stub pointing to `GymMembership` contract
- [x] Create `src/mappings.ts` stub AssemblyScript file

### 1.6 SDK Project Setup (`sdk/`)
- [x] `cd sdk && npm init -y --scope @flexpass` (package name: `@flexpass/verifier`)
- [x] Install: `npm i viem`
- [x] Install dev: `npm i -D typescript tsup`
- [x] Create `src/index.ts` with `checkAccess` stub function
- [x] Create `src/types.ts` with `AccessResult` and `VerifierConfig` interfaces
- [x] Configure `tsup.config.ts` for dual CJS + ESM output

### 1.7 Environment Variables
- [x] Create root `.env.example` with all variables from Section 17 and empty placeholder values
- [x] Add `contracts/.env.example` with `POLYGON_RPC_URL`, `AMOY_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `POLYGONSCAN_API_KEY`
- [x] Add `frontend/.env.example` with all `NEXT_PUBLIC_*` variables
- [x] Add `api/.env.example` with `DATABASE_URL`, `PINATA_JWT`, `COINGECKO_API_KEY`, `WEBHOOK_HMAC_SECRET`
- [x] Add all `.env*` patterns to root `.gitignore`

---

## Phase 2: Smart Contract — Shared Library

### 2.1 MembershipLib.sol
- [x] Create `src/libraries/MembershipLib.sol`
- [x] Define `struct Tier { uint8 tierId; string name; uint256 pricePerMonth; uint256 maxCapacity; }`
- [x] Define `struct GymInfo { address gymAddress; address treasury; string name; uint96 royaltyBps; bool approved; }`
- [x] Define `struct Listing { uint256 tokenId; address seller; uint256 priceWei; uint256 listedAt; bool active; }`
- [x] Define `struct MembershipInfo { uint256 tokenId; address gymAddress; uint8 tierId; uint64 expiresAt; address owner; address user; }`
- [x] Define `uint96 constant MAX_ROYALTY_BPS = 3000` (30% cap)
- [x] Define `uint256 constant PROTOCOL_FEE_BPS = 100` (1% protocol fee)
- [x] Add library-level `validateRoyalty(uint96 bps)` function returning bool

### 2.2 IERC4907.sol Interface
- [x] Create `src/interfaces/IERC4907.sol`
- [x] Define `function setUser(uint256 tokenId, address user, uint64 expires) external`
- [x] Define `function userOf(uint256 tokenId) external view returns (address)`
- [x] Define `function userExpires(uint256 tokenId) external view returns (uint256)`
- [x] Define `event UpdateUser(uint256 indexed tokenId, address indexed user, uint64 expires)`
- [x] Add `supportsInterface` declaration returning `bytes4(0xad092b5c)` (ERC-4907 interface ID)

### 2.3 IGymRegistry.sol Interface
- [x] Create `src/interfaces/IGymRegistry.sol`
- [x] Define `function isApproved(address gymAddress) external view returns (bool)`
- [x] Define `function getGymInfo(address gymAddress) external view returns (MembershipLib.GymInfo memory)`
- [x] Define `function getTreasury(address gymAddress) external view returns (address)`
- [x] Define `function getRoyaltyBps(address gymAddress) external view returns (uint96)`

---

## Phase 3: Smart Contract — GymRegistry.sol

### 3.1 Contract Shell
- [x] Create `src/GymRegistry.sol`
- [x] Add SPDX license identifier `MIT` and `pragma solidity ^0.8.20`
- [x] Import `@openzeppelin/contracts/access/Ownable2Step.sol`
- [x] Import `@openzeppelin/contracts/utils/Pausable.sol`
- [x] Import `./libraries/MembershipLib.sol` and `./interfaces/IGymRegistry.sol`
- [x] Declare contract `GymRegistry is Ownable2Step, Pausable, IGymRegistry`
- [x] Add `mapping(address => MembershipLib.GymInfo) private _gyms` state variable
- [x] Add `address[] private _gymList` for enumeration
- [x] Declare constructor accepting `initialOwner` address, pass to `Ownable2Step(initialOwner)`

### 3.2 Events
- [x] Define `event GymRegistered(address indexed gymAddress, string name, address treasury)`
- [x] Define `event GymApproved(address indexed gymAddress)`
- [x] Define `event GymRevoked(address indexed gymAddress)`
- [x] Define `event TreasuryUpdated(address indexed gymAddress, address oldTreasury, address newTreasury)`

### 3.3 Custom Errors
- [x] Define `error GR_AlreadyRegistered(address gymAddress)`
- [x] Define `error GR_NotRegistered(address gymAddress)`
- [x] Define `error GR_RoyaltyTooHigh(uint96 provided, uint96 max)`
- [x] Define `error GR_ZeroAddress()`

### 3.4 Registration & Approval Functions
- [x] Implement `registerGym(address gymAddress, address treasury, string calldata name, uint96 royaltyBps)` — stores `_gyms[gymAddress]`, appends to `_gymList`, emits `GymRegistered`
- [x] Add `if (_gyms[gymAddress].gymAddress != address(0)) revert GR_AlreadyRegistered(gymAddress)` guard
- [x] Add `if (royaltyBps > MembershipLib.MAX_ROYALTY_BPS) revert GR_RoyaltyTooHigh(royaltyBps, MAX_ROYALTY_BPS)` guard
- [x] Add `if (treasury == address(0)) revert GR_ZeroAddress()` guard
- [x] Implement `approveGym(address gymAddress) external onlyOwner` — sets `_gyms[gymAddress].approved = true`, emits `GymApproved`
- [x] Implement `revokeGym(address gymAddress) external onlyOwner` — sets `_gyms[gymAddress].approved = false`, emits `GymRevoked`
- [x] Implement `updateTreasury(address newTreasury) external` — caller must be the registered `gymAddress`, updates treasury, emits `TreasuryUpdated`

### 3.5 View Functions
- [x] Implement `isApproved(address gymAddress) external view returns (bool)` — returns `_gyms[gymAddress].approved`
- [x] Implement `getGymInfo(address gymAddress) external view returns (GymInfo memory)` — returns `_gyms[gymAddress]`
- [x] Implement `getTreasury(address gymAddress) external view returns (address)` — returns `_gyms[gymAddress].treasury`
- [x] Implement `getRoyaltyBps(address gymAddress) external view returns (uint96)` — returns `_gyms[gymAddress].royaltyBps`
- [x] Implement `getAllGyms() external view returns (address[] memory)` — returns `_gymList`
- [x] Implement `getApprovedGyms() external view returns (address[] memory)` — filters `_gymList` for approved

---

## Phase 4: Smart Contract — GymMembership.sol

### 4.1 Contract Shell
- [x] Create `src/GymMembership.sol`
- [x] Add pragma `^0.8.20` and MIT license
- [x] Import `@openzeppelin/contracts/token/ERC721/ERC721.sol`
- [x] Import `@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol`
- [x] Import `@openzeppelin/contracts/token/common/ERC2981.sol`
- [x] Import `@openzeppelin/contracts/access/Ownable2Step.sol`
- [x] Import `@openzeppelin/contracts/utils/Pausable.sol`
- [x] Import `@openzeppelin/contracts/utils/ReentrancyGuard.sol`
- [x] Import `./interfaces/IERC4907.sol`, `./interfaces/IGymRegistry.sol`, `./libraries/MembershipLib.sol`
- [x] Declare `contract GymMembership is ERC721URIStorage, ERC2981, Ownable2Step, Pausable, ReentrancyGuard, IERC4907`

### 4.2 State Variables
- [x] Add `uint256 private _nextTokenId` counter (starts at 1)
- [x] Add `IGymRegistry public immutable registry` set in constructor
- [x] Add `address public protocolTreasury` for 1% fee collection
- [x] Add `mapping(uint256 => IERC4907.UserInfo) private _users` struct: `{ address user; uint64 expires }`
- [x] Add `mapping(uint256 => address) private _membershipGym` (tokenId → gym address)
- [x] Add `mapping(uint256 => uint8) private _membershipTier` (tokenId → tier ID)

### 4.3 Events
- [x] Define `event MembershipMinted(uint256 indexed tokenId, address indexed gymAddress, uint8 tierId, address indexed owner, uint64 expires)`
- [x] Define `event MembershipBurned(uint256 indexed tokenId)`

### 4.4 Custom Errors
- [x] Define `error GM_GymNotApproved(address gymAddress)`
- [x] Define `error GM_ZeroDuration()`
- [x] Define `error GM_InsufficientPayment(uint256 sent, uint256 required)`
- [x] Define `error GM_NotOwner(uint256 tokenId, address caller)`

### 4.5 Constructor
- [x] Define constructor accepting `registryAddress`, `protocolTreasury_`, `initialOwner`
- [x] Call `ERC721("FlexPass Membership", "FLEX")` and `Ownable2Step(initialOwner)`
- [x] Set `registry = IGymRegistry(registryAddress)` and `protocolTreasury = protocolTreasury_`

### 4.6 ERC-4907 Core Functions
- [x] Implement `setUser(uint256 tokenId, address user, uint64 expires) external` — only owner or approved can call; store in `_users[tokenId]`; emit `UpdateUser`
- [x] Add guard: `require(_isApprovedOrOwner(msg.sender, tokenId))` in `setUser`
- [x] Implement `userOf(uint256 tokenId) external view returns (address)` — return `_users[tokenId].user` if `block.timestamp <= _users[tokenId].expires`, else `address(0)`
- [x] Implement `userExpires(uint256 tokenId) external view returns (uint256)` — return `_users[tokenId].expires`
- [x] Override `_update(address to, uint256 tokenId, address auth)` to clear `_users[tokenId]` on transfer (ERC-721 hook to reset user on ownership change)

### 4.7 Minting Functions
- [x] Implement `mintMembership(address to, address gymAddress, uint8 tierId, uint256 durationDays) external payable whenNotPaused returns (uint256 tokenId)`
- [x] Add `if (!registry.isApproved(gymAddress)) revert GM_GymNotApproved(gymAddress)` check
- [x] Add `if (durationDays == 0) revert GM_ZeroDuration()` check
- [x] Calculate `expiresAt = uint64(block.timestamp + durationDays * 1 days)`
- [x] Mint: `_safeMint(to, _nextTokenId)`
- [x] Set user: `_users[_nextTokenId] = UserInfo({ user: to, expires: expiresAt })`
- [x] Set royalty: `_setTokenRoyalty(_nextTokenId, registry.getTreasury(gymAddress), registry.getRoyaltyBps(gymAddress))`
- [x] Set metadata: `_setTokenURI(_nextTokenId, tokenUri)` (tokenUri passed as param from frontend IPFS upload)
- [x] Store gym/tier mappings: `_membershipGym[_nextTokenId] = gymAddress`; `_membershipTier[_nextTokenId] = tierId`
- [x] Emit `MembershipMinted`
- [x] Increment `_nextTokenId++`
- [x] Return `tokenId`
- [x] Implement `batchMintMembership(address[] calldata recipients, address gymAddress, uint8 tierId, uint256 durationDays, string[] calldata tokenURIs) external payable whenNotPaused returns (uint256[] memory tokenIds)`
- [x] Loop over `recipients`, call internal `_mintOne(recipient, gymAddress, tierId, durationDays, uri)` helper for each
- [x] Return array of minted `tokenIds`

### 4.8 View Functions
- [x] Implement `getMembershipGym(uint256 tokenId) external view returns (address)`
- [x] Implement `getMembershipTier(uint256 tokenId) external view returns (uint8)`
- [x] Override `supportsInterface(bytes4 interfaceId)` to return true for ERC-4907 interface ID `0xad092b5c`, ERC-2981 `0x2a55205a`, and call `super.supportsInterface(interfaceId)`

### 4.9 Admin Functions
- [x] Implement `setProtocolTreasury(address newTreasury) external onlyOwner`
- [x] Implement `pause() external onlyOwner`
- [x] Implement `unpause() external onlyOwner`

---

## Phase 5: Smart Contract — FlexPassMarket.sol

### 5.1 Contract Shell
- [x] Create `src/FlexPassMarket.sol`
- [x] Import `@openzeppelin/contracts/token/ERC721/IERC721.sol`
- [x] Import `@openzeppelin/contracts/interfaces/IERC2981.sol`
- [x] Import `@openzeppelin/contracts/access/Ownable2Step.sol`
- [x] Import `@openzeppelin/contracts/utils/Pausable.sol`
- [x] Import `@openzeppelin/contracts/utils/ReentrancyGuard.sol`
- [x] Import `./interfaces/IERC4907.sol` and `./libraries/MembershipLib.sol`
- [x] Declare `contract FlexPassMarket is Ownable2Step, Pausable, ReentrancyGuard`

### 5.2 State Variables
- [x] Add `IERC721 public immutable membershipNFT` — the `GymMembership` contract
- [x] Add `address public protocolTreasury`
- [x] Add `mapping(uint256 => MembershipLib.Listing) private _listings` (tokenId → Listing)
- [x] Add `uint256 public protocolFeeBps = 100` (1%)

### 5.3 Events
- [ ] Define `event MembershipListed(uint256 indexed tokenId, address indexed seller, uint256 priceWei)`
- [ ] Define `event MembershipSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 priceWei, uint256 royaltyPaid)`
- [ ] Define `event MembershipDelisted(uint256 indexed tokenId, address indexed seller)`
- [ ] Define `event PriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice)`

### 5.4 Custom Errors
- [ ] Define `error MKT_NotOwner(uint256 tokenId)`
- [ ] Define `error MKT_AlreadyListed(uint256 tokenId)`
- [ ] Define `error MKT_NotListed(uint256 tokenId)`
- [ ] Define `error MKT_Expired(uint256 tokenId)`
- [ ] Define `error MKT_WrongValue(uint256 sent, uint256 required)`
- [ ] Define `error MKT_SelfBuy()`
- [ ] Define `error MKT_InactiveListing()`
- [ ] Define `error MKT_OwnerMismatch(uint256 tokenId)`

### 5.5 listMembership Function
- [ ] Implement `listMembership(uint256 tokenId, uint256 priceWei) external whenNotPaused`
- [ ] Check `membershipNFT.ownerOf(tokenId) == msg.sender` → revert `MKT_NotOwner`
- [ ] Check `_listings[tokenId].active == false` → revert `MKT_AlreadyListed`
- [ ] Check `IERC4907(address(membershipNFT)).userExpires(tokenId) > block.timestamp` → revert `MKT_Expired`
- [ ] Call `membershipNFT.transferFrom(msg.sender, address(this), tokenId)` to escrow
- [ ] Store `_listings[tokenId] = Listing({ tokenId, seller: msg.sender, priceWei, listedAt: block.timestamp, active: true })`
- [ ] Emit `MembershipListed`

### 5.6 buyMembership Function
- [ ] Implement `buyMembership(uint256 tokenId) external payable whenNotPaused nonReentrant`
- [ ] Check `_listings[tokenId].active` → revert `MKT_InactiveListing`
- [ ] Check `msg.sender != _listings[tokenId].seller` → revert `MKT_SelfBuy`
- [ ] Check `membershipNFT.ownerOf(tokenId) == address(this)` → revert `MKT_OwnerMismatch` (orphan protection)
- [ ] Check `msg.value == _listings[tokenId].priceWei` → revert `MKT_WrongValue`
- [ ] Call `IERC2981(address(membershipNFT)).royaltyInfo(tokenId, msg.value)` → get `(royaltyReceiver, royaltyAmount)`
- [ ] Calculate `protocolFee = msg.value * protocolFeeBps / 10000`
- [ ] Calculate `sellerProceeds = msg.value - royaltyAmount - protocolFee`
- [ ] Mark listing inactive: `_listings[tokenId].active = false`
- [ ] Transfer NFT: `membershipNFT.transferFrom(address(this), msg.sender, tokenId)` (checks-effects-interactions: state updated before external calls)
- [ ] Set user role: `IERC4907(address(membershipNFT)).setUser(tokenId, msg.sender, uint64(_listings[tokenId].expiresAt))` — NOTE: need to store `expiresAt` in Listing struct
- [ ] Transfer royalty: `(bool ok,) = royaltyReceiver.call{value: royaltyAmount}("")` with `require(ok)`
- [ ] Transfer protocol fee: `(bool ok2,) = protocolTreasury.call{value: protocolFee}("")` with `require(ok2)`
- [ ] Transfer seller proceeds: `(bool ok3,) = _listings[tokenId].seller.call{value: sellerProceeds}("")` with `require(ok3)`
- [ ] Emit `MembershipSold`

### 5.7 delistMembership Function
- [ ] Implement `delistMembership(uint256 tokenId) external whenNotPaused`
- [ ] Check `_listings[tokenId].active` → revert `MKT_InactiveListing`
- [ ] Check `_listings[tokenId].seller == msg.sender` → revert `MKT_NotOwner`
- [ ] Mark inactive: `_listings[tokenId].active = false`
- [ ] Return NFT: `membershipNFT.transferFrom(address(this), msg.sender, tokenId)`
- [ ] Emit `MembershipDelisted`

### 5.8 updatePrice Function
- [ ] Implement `updatePrice(uint256 tokenId, uint256 newPriceWei) external`
- [ ] Check `_listings[tokenId].active` → revert `MKT_InactiveListing`
- [ ] Check `_listings[tokenId].seller == msg.sender` → revert `MKT_NotOwner`
- [ ] Emit `PriceUpdated` with old and new price
- [ ] Update `_listings[tokenId].priceWei = newPriceWei`

### 5.9 cleanExpiredListing Function
- [ ] Implement `cleanExpiredListing(uint256 tokenId) external`
- [ ] Check `_listings[tokenId].active` → revert `MKT_InactiveListing`
- [ ] Check `IERC4907(address(membershipNFT)).userExpires(tokenId) <= block.timestamp` (must be expired)
- [ ] Mark inactive: `_listings[tokenId].active = false`
- [ ] Return NFT to seller: `membershipNFT.transferFrom(address(this), _listings[tokenId].seller, tokenId)`
- [ ] Emit `MembershipDelisted`

### 5.10 View Functions
- [ ] Implement `getListing(uint256 tokenId) external view returns (Listing memory)`
- [ ] Implement `isListed(uint256 tokenId) external view returns (bool)` — returns `_listings[tokenId].active`

### 5.11 Admin Functions
- [ ] Implement `setProtocolFeeBps(uint256 newBps) external onlyOwner` — cap at 500 (5%)
- [ ] Implement `setProtocolTreasury(address newTreasury) external onlyOwner`
- [ ] Implement `pause() external onlyOwner`
- [ ] Implement `unpause() external onlyOwner`

---

## Phase 6: Deployment Scripts

### 6.1 Deploy.s.sol
- [ ] Create `script/Deploy.s.sol` with `pragma solidity ^0.8.20` and `import "forge-std/Script.sol"`
- [ ] In `run()`: read `DEPLOYER_PRIVATE_KEY` from env via `vm.envUint("DEPLOYER_PRIVATE_KEY")`
- [ ] Read `PROTOCOL_TREASURY` from env via `vm.envAddress("PROTOCOL_TREASURY")`
- [ ] `vm.startBroadcast(deployerKey)`
- [ ] Deploy `GymRegistry` with `new GymRegistry(deployer)`
- [ ] Deploy `GymMembership` with `new GymMembership(address(registry), protocolTreasury, deployer)`
- [ ] Deploy `FlexPassMarket` with `new FlexPassMarket(address(membership), protocolTreasury, deployer)`
- [ ] `vm.stopBroadcast()`
- [ ] Log addresses with `console.log("GymRegistry:", address(registry))`

### 6.2 SeedTestData.s.sol
- [ ] Create `script/SeedTestData.s.sol`
- [ ] Register 2 test gyms: "FitZone Mumbai" and "GoldGym Pune"
- [ ] Approve both gyms via `registry.approveGym()`
- [ ] Mint 3 test memberships for test address (30-day Standard tier)
- [ ] List 1 membership on the market at 10 MATIC

---

## Phase 7: Foundry Tests

### 7.1 GymRegistry.t.sol
- [ ] Create `test/GymRegistry.t.sol` with `import "forge-std/Test.sol"` and `import "../src/GymRegistry.sol"`
- [ ] `setUp()`: deploy `GymRegistry` with `new GymRegistry(address(this))`
- [ ] Test `registerGym` emits `GymRegistered` event — use `vm.expectEmit(true, true, false, true)`
- [ ] Test `registerGym` with zero treasury address reverts with `GR_ZeroAddress`
- [ ] Test `registerGym` with royalty > 3000 bps reverts with `GR_RoyaltyTooHigh`
- [ ] Test duplicate `registerGym` reverts with `GR_AlreadyRegistered`
- [ ] Test `approveGym` called by non-owner reverts
- [ ] Test `isApproved` returns false before approval
- [ ] Test `isApproved` returns true after `approveGym`
- [ ] Test `revokeGym` sets `isApproved` back to false
- [ ] Test `updateTreasury` called by gym address succeeds; called by other address reverts
- [ ] Test `getAllGyms` returns correct count after registration

### 7.2 GymMembership.t.sol
- [ ] Create `test/GymMembership.t.sol`
- [ ] `setUp()`: deploy Registry, approve a test gym, deploy `GymMembership`
- [ ] Test `mintMembership` with unapproved gym reverts `GM_GymNotApproved`
- [ ] Test `mintMembership` with `durationDays = 0` reverts `GM_ZeroDuration`
- [ ] Test `mintMembership` returns `tokenId = 1` on first call
- [ ] Test `ownerOf(1) == buyer` after mint
- [ ] Test `userOf(1) == buyer` immediately after mint
- [ ] Test `userExpires(1)` equals `block.timestamp + durationDays * 86400`
- [ ] Test `vm.warp(expiresAt + 1)` → `userOf(1)` returns `address(0)`
- [ ] Test `royaltyInfo(1, 1 ether)` returns `(gymTreasury, 0.1 ether)` for 10% royalty
- [ ] Test transfer clears `_users[tokenId]`: transfer token to address B, verify `userOf(1) == address(0)`
- [ ] Test `batchMintMembership` for 3 recipients returns 3 tokenIds
- [ ] Test `pause()` → `mintMembership` reverts
- [ ] Test `supportsInterface` returns true for ERC-4907 `0xad092b5c` and ERC-2981 `0x2a55205a`

### 7.3 FlexPassMarket.t.sol
- [ ] Create `test/FlexPassMarket.t.sol`
- [ ] `setUp()`: deploy full stack (Registry, Membership, Market); mint tokenId 1 to `alice`; `vm.prank(alice)` approve market for token
- [ ] Test `listMembership` from alice succeeds, emits `MembershipListed`
- [ ] Test `listMembership` from non-owner `bob` reverts `MKT_NotOwner`
- [ ] Test `listMembership` of expired token reverts `MKT_Expired`
- [ ] Test `isListed(1)` returns true after listing
- [ ] Test `buyMembership` with correct value from bob succeeds, emits `MembershipSold`
- [ ] Test after `buyMembership`: `ownerOf(1) == bob`, `userOf(1) == bob`
- [ ] Test seller balance increased by `priceWei - royalty - fee` after buy
- [ ] Test gym treasury received royalty amount after buy
- [ ] Test protocol treasury received 1% fee after buy
- [ ] Test `buyMembership` from alice (self-buy) reverts `MKT_SelfBuy`
- [ ] Test `buyMembership` with wrong value reverts `MKT_WrongValue`
- [ ] Test `delistMembership` by alice returns token, marks listing inactive
- [ ] Test `delistMembership` by bob reverts `MKT_NotOwner`
- [ ] Test `updatePrice` by alice changes price, emits `PriceUpdated`
- [ ] Test `cleanExpiredListing` after `vm.warp(expires + 1)` succeeds
- [ ] Test `cleanExpiredListing` on non-expired listing reverts

### 7.4 Fuzz.t.sol
- [ ] Create `test/Fuzz.t.sol`
- [ ] Fuzz `mintMembership(durationDays)`: for any `durationDays > 0`, `userExpires(tokenId)` equals `block.timestamp + durationDays * 86400`
- [ ] Fuzz `listMembership(priceWei)`: for any valid price, listing stores correct `priceWei`
- [ ] Fuzz `buyMembership(value)`: sending wrong value always reverts; sending correct value always succeeds
- [ ] Fuzz `royaltyInfo(tokenId, salePrice)`: returned royalty equals `salePrice * royaltyBps / 10000`
- [ ] Fuzz `registerGym(royaltyBps)`: `royaltyBps > 3000` always reverts

### 7.5 Integration.t.sol
- [ ] Create `test/Integration.t.sol`
- [ ] Test complete flow: register gym → approve → mint → list → buy → entry verify (`userOf` check)
- [ ] Test royalty distribution across all 3 parties in one transaction
- [ ] Test reentrancy: deploy `ReentrantBuyer` mock contract, call `buyMembership` from within fallback, verify second call reverts
- [ ] Test pause/unpause full market cycle

---

## Phase 8: Subgraph Implementation

### 8.1 Schema Definition
- [ ] Define `Membership @entity` with all fields: `id`, `gymAddress`, `tierId`, `owner`, `user`, `expiresAt`, `mintedAt`, `uri`, `currentListing`, `transactions`
- [ ] Define `Listing @entity` with: `id`, `membership`, `seller`, `priceWei`, `listedAt`, `active`
- [ ] Define `MembershipTransaction @entity` with: `id`, `type`, `membership`, `from`, `to`, `priceWei`, `royaltyPaid`, `timestamp`
- [ ] Define `Gym @entity` with: `id`, `name`, `treasury`, `royaltyBps`, `approved`, `totalMinted`, `totalRoyaltyEarned`

### 8.2 Subgraph Manifest
- [ ] Add `GymMembership` contract as `dataSource` in `subgraph.yaml` with startBlock
- [ ] Add `FlexPassMarket` contract as `dataSource` in `subgraph.yaml`
- [ ] Add `GymRegistry` contract as `dataSource` in `subgraph.yaml`
- [ ] Map each event to an AssemblyScript handler function
- [ ] Run `graph codegen` to generate TypeScript types from schema

### 8.3 AssemblyScript Mappings
- [ ] Implement `handleMembershipMinted(event)`: create or update `Membership` entity; create `MembershipTransaction` with type "mint"
- [ ] Implement `handleUpdateUser(event)`: update `Membership.user` and `Membership.expiresAt`
- [ ] Implement `handleMembershipListed(event)`: create `Listing` entity with `active = true`; link to `Membership.currentListing`
- [ ] Implement `handleMembershipSold(event)`: update `Listing.active = false`; create `MembershipTransaction` with type "buy" and `royaltyPaid`; update `Membership.owner` and `Membership.user`; increment `Gym.totalRoyaltyEarned`
- [ ] Implement `handleMembershipDelisted(event)`: update `Listing.active = false`
- [ ] Implement `handleGymRegistered(event)`: create `Gym` entity
- [ ] Implement `handleGymApproved(event)`: update `Gym.approved = true`

### 8.4 Build & Deploy
- [ ] Run `graph build` and verify no AssemblyScript errors
- [ ] Deploy to The Graph Studio: `graph deploy --studio flexpass`
- [ ] Verify entities appear in Studio playground with test queries
- [ ] Test GraphQL query: `{ memberships(where: { owner: "0x..." }) { id expiresAt } }`
- [ ] Test GraphQL query: `{ listings(where: { active: true }) { id priceWei seller } }`

---

## Phase 9: API Server

### 9.1 Prisma Schema
- [ ] Define `model Gym { id String @id; name String; address String @unique; treasury String; royaltyBps Int; approved Boolean; createdAt DateTime @default(now()) }`
- [ ] Define `model MembershipCache { id String @id; tokenId String @unique; gymAddress String; tierId Int; ownerAddress String; userAddress String; expiresAt DateTime; metadataUri String; updatedAt DateTime @updatedAt }`
- [ ] Define `model EntryEvent { id String @id @default(cuid()); tokenId String; gymAddress String; enteredAt DateTime @default(now()); walletAddress String }`
- [ ] Run `npx prisma migrate dev --name init` to create tables
- [ ] Run `npx prisma generate` to update client types

### 9.2 Routes — membership.ts
- [ ] Implement `GET /api/membership/:tokenId` — query `MembershipCache` by tokenId; if miss, fetch from chain via `publicClient.readContract({ address: GYM_MEMBERSHIP_ADDRESS, abi: GymMembershipABI, functionName: 'userOf', args: [BigInt(tokenId)] })` and cache
- [ ] Return `{ tokenId, gymAddress, tierId, owner, user, expiresAt, metadataUri, isActive }` JSON

### 9.3 Routes — gym.ts
- [ ] Implement `GET /api/gym/:address` — query `Gym` model by address, return full gym info
- [ ] Implement `GET /api/gym/:address/listings` — call The Graph subgraph with `listings(where: { membership_: { gymAddress: address }, active: true })` query via fetch
- [ ] Implement `POST /api/gym/register` — validate body, insert into `Gym` table as pending, call `registry.registerGym` via `walletClient.writeContract(...)` (server wallet signs), return tx hash

### 9.4 Routes — metadata.ts
- [ ] Implement `POST /api/metadata/upload` — accept `{ gymName, tier, amenities, expiresAt, logoUrl }` body
- [ ] Build metadata JSON: `{ name, description, image, attributes: [{ trait_type: 'Gym', value: gymName }, ...] }`
- [ ] Call Pinata: `pinata.upload.json(metadata)` → returns `{ IpfsHash }` 
- [ ] Return `ipfs://${IpfsHash}` as `tokenUri`

### 9.5 Routes — webhooks.ts
- [ ] Implement `POST /webhooks/gym-entry` — validate HMAC-SHA256 signature header `X-FlexPass-Signature`
- [ ] Parse `{ tokenId, gymAddress, walletAddress, timestamp }` body
- [ ] Insert `EntryEvent` row into PostgreSQL
- [ ] Return 200 OK

### 9.6 Viem Client Setup
- [ ] Create `services/onchain.ts` with `createPublicClient({ chain: polygon, transport: http(process.env.POLYGON_RPC_URL) })`
- [ ] Export `readMembershipState(tokenId)` that calls `userOf` and `userExpires` and returns combined result

### 9.7 Pinata Service
- [ ] Create `services/pinata.ts` with `new PinataSDK({ pinataJwt: process.env.PINATA_JWT })`
- [ ] Implement `uploadMetadata(metadata: object): Promise<string>` → returns `ipfs://` URI
- [ ] Implement `getMetadata(cid: string): Promise<object>` → fetches from Pinata gateway

---

## Phase 10: Frontend Components

### 10.1 Wagmi Config
- [ ] Create `lib/wagmi.ts` with `getDefaultConfig({ appName: 'FlexPass', projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID, chains: [polygon, polygonAmoy], ssr: true })`
- [ ] Export config as default

### 10.2 Contract Bindings
- [ ] Create `lib/contracts.ts` with `GYM_MEMBERSHIP_ADDRESS`, `MARKET_ADDRESS`, `REGISTRY_ADDRESS` per chainId
- [ ] Export `GymMembershipABI` (copy from `contracts/out/GymMembership.sol/GymMembership.json` after build)
- [ ] Export `FlexPassMarketABI`
- [ ] Export `GymRegistryABI`

### 10.3 Subgraph Client
- [ ] Create `lib/subgraph.ts` with `const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL`
- [ ] Implement `querySubgraph(query: string, variables?: object)` → fetch with POST, return `data` field
- [ ] Define `GET_USER_MEMBERSHIPS` GraphQL query string
- [ ] Define `GET_ACTIVE_LISTINGS` GraphQL query string
- [ ] Define `GET_LISTING_BY_TOKEN_ID` GraphQL query string

### 10.4 Custom Hooks
- [ ] Create `hooks/useMemberships.ts` — `useQuery` from TanStack that calls `querySubgraph(GET_USER_MEMBERSHIPS, { owner: address?.toLowerCase() })` when wallet connected
- [ ] Create `hooks/useListings.ts` — `useQuery` for active marketplace listings with optional `gymAddress` filter
- [ ] Create `hooks/useRoyaltyInfo.ts` — `useReadContract` with `functionName: 'royaltyInfo'`, returns `{ receiver, royaltyAmount }`
- [ ] Create `hooks/useListMembership.ts` — step 1: `useWriteContract` for `approve(marketAddress, tokenId)`; step 2: `useWriteContract` for `listMembership(tokenId, priceWei)`; expose `list(tokenId, priceWei)` function that runs both in sequence
- [ ] Create `hooks/useBuyMembership.ts` — `useWriteContract` for `buyMembership(tokenId)` with `value: listing.priceWei`

### 10.5 MembershipCard Component
- [ ] Create `components/MembershipCard.tsx`
- [ ] Accept props: `{ tokenId, gymName, tier, expiresAt, isListed }`
- [ ] Display gym name, tier badge, expiry date
- [ ] Show `<ExpiryCountdown expiresAt={expiresAt} />` for remaining time
- [ ] Show "Sell" button if not listed; "Listed" badge if listed

### 10.6 ExpiryCountdown Component
- [ ] Create `components/ExpiryCountdown.tsx`
- [ ] Accept `expiresAt: number` (unix timestamp)
- [ ] Use `useEffect` + `setInterval` to update countdown every second
- [ ] Show "X days Y hours" format; red if < 7 days remaining
- [ ] Show "Expired" in red if `expiresAt < Date.now() / 1000`

### 10.7 ListingCard Component
- [ ] Create `components/ListingCard.tsx`
- [ ] Accept `{ tokenId, gymName, tier, expiresAt, priceWei, seller }`
- [ ] Display price in MATIC and ~INR equivalent (from `priceFeed` via API)
- [ ] Show "Buy" button linking to `/buy/${tokenId}`
- [ ] Show expiry countdown

### 10.8 RoyaltyBreakdown Component
- [ ] Create `components/RoyaltyBreakdown.tsx`
- [ ] Accept `{ priceWei, royaltyBps, gymName }`
- [ ] Show table: Total Price / Gym Royalty (% and MATIC amount) / Protocol Fee (1%) / Seller Receives
- [ ] Use `formatUnits(royaltyAmount, 18)` from viem for MATIC display

### 10.9 Pages
- [ ] Create `app/page.tsx` — hero section, stats ticker (total minted from subgraph), CTA buttons "Browse Listings" and "Connect Wallet"
- [ ] Create `app/dashboard/page.tsx` — `'use client'`; fetch memberships via `useMemberships()`; render grid of `<MembershipCard>` components; show empty state if none
- [ ] Create `app/marketplace/page.tsx` — `'use client'`; `useListings()`; filter controls (gym/tier/price); paginated listing grid
- [ ] Create `app/sell/[tokenId]/page.tsx` — token detail; price input; royalty breakdown preview; "Approve & List" button using `useListMembership`
- [ ] Create `app/buy/[tokenId]/page.tsx` — listing detail; royalty breakdown; "Buy Now" button using `useBuyMembership`
- [ ] Create `app/gym/[address]/page.tsx` — gym info from API; active listings for gym; "Buy New Membership" button

### 10.10 Formatting Utilities
- [ ] Create `lib/formatters.ts`
- [ ] Implement `formatMATIC(wei: bigint): string` — uses viem `formatEther` + rounds to 4 decimals
- [ ] Implement `formatExpiry(timestamp: number): string` — returns "Jan 5, 2026" format
- [ ] Implement `daysRemaining(timestamp: number): number` — returns days until expiry, 0 if expired
- [ ] Implement `calcRoyalty(priceWei: bigint, royaltyBps: number): bigint` — returns `priceWei * BigInt(royaltyBps) / 10000n`
- [ ] Implement `calcProtocolFee(priceWei: bigint): bigint` — returns `priceWei * 100n / 10000n`

---

## Phase 11: SDK — @flexpass/verifier

### 11.1 Types
- [ ] Create `src/types.ts`
- [ ] Define `interface VerifierConfig { rpcUrl: string; contractAddress: string; abi: unknown[]; offlineGracePeriodMs?: number }`
- [ ] Define `interface AccessResult { valid: boolean; user: string; expiresAt: Date; tokenId: number; tierId: number; gymAddress: string }`

### 11.2 checkAccess Function
- [ ] Create `src/index.ts`
- [ ] Implement `createVerifier(config: VerifierConfig)` → returns `{ checkAccess }` object
- [ ] Inside `checkAccess(tokenId: number): Promise<AccessResult>`:
  - [ ] Create `publicClient = createPublicClient({ chain: polygon, transport: http(config.rpcUrl) })` via viem
  - [ ] Call `publicClient.readContract({ address: config.contractAddress, abi: config.abi, functionName: 'userOf', args: [BigInt(tokenId)] })` → get `user: Address`
  - [ ] Call `publicClient.readContract({ ..., functionName: 'userExpires', args: [BigInt(tokenId)] })` → get `expires: bigint`
  - [ ] If `user === '0x0000000000000000000000000000000000000000'` → return `{ valid: false }`
  - [ ] If `Date.now() / 1000 > Number(expires)` → return `{ valid: false }`
  - [ ] Return `{ valid: true, user, expiresAt: new Date(Number(expires) * 1000), tokenId, ... }`
- [ ] Implement offline fallback: if RPC call throws, check cached state; if cached state < 60 seconds old, return cached result
- [ ] Export `checkAccess` as named and default export

### 11.3 Build & Publish
- [ ] Configure `tsup.config.ts` for `entry: ['src/index.ts']`, `format: ['cjs', 'esm']`, `dts: true`
- [ ] Add `exports` field in `package.json` for dual CJS/ESM
- [ ] Add `"peerDependencies": { "viem": "^2.0.0" }`
- [ ] Write `sdk/README.md` with install instructions and `checkAccess` code example

---

## Phase 12: CI/CD Pipeline

### 12.1 CI Workflow (`.github/workflows/ci.yml`)
- [ ] Set trigger: `on: [push, pull_request]`
- [ ] Job `lint-contracts`: `forge fmt --check`, `solhint 'src/**/*.sol'`
- [ ] Job `test-contracts`: `forge test -vvv`, fail if any test fails
- [ ] Job `fuzz-contracts`: `forge test --fuzz-runs 1000 --match-path 'test/Fuzz.t.sol'`
- [ ] Job `coverage`: `forge coverage --report lcov`, upload to Codecov, fail if < 90%
- [ ] Job `lint-frontend`: `cd frontend && eslint . && tsc --noEmit`
- [ ] Job `test-frontend`: `cd frontend && vitest run`
- [ ] Job `build-frontend`: `cd frontend && next build`
- [ ] Job `slither`: `pip install slither-analyzer --break-system-packages && slither contracts/src/ --detect all` — allow high severity in pre-audit but report

### 12.2 Deploy Workflow (`.github/workflows/deploy.yml`)
- [ ] Set trigger: `on: push: tags: ['v*']`
- [ ] Job `deploy-contracts`: `forge script script/Deploy.s.sol --rpc-url $AMOY_RPC_URL --broadcast --verify`
- [ ] Job `deploy-subgraph`: `graph deploy --studio flexpass --deploy-key $GRAPH_STUDIO_DEPLOY_KEY`
- [ ] Job `deploy-frontend`: `vercel deploy --prod --token $VERCEL_TOKEN`
- [ ] Store all secrets in GitHub repository secrets

### 12.3 Makefile
- [ ] `make test`: `cd contracts && forge test -vvv`
- [ ] `make fmt`: `cd contracts && forge fmt`
- [ ] `make coverage`: `cd contracts && forge coverage --report lcov`
- [ ] `make deploy-amoy`: `cd contracts && forge script script/Deploy.s.sol --rpc-url $$AMOY_RPC_URL --private-key $$DEPLOYER_PRIVATE_KEY --broadcast --verify`
- [ ] `make deploy-mainnet`: same with `POLYGON_RPC_URL`
- [ ] `make subgraph-build`: `cd subgraph && graph codegen && graph build`
- [ ] `make subgraph-deploy`: `cd subgraph && graph deploy --studio flexpass`
- [ ] `make sdk-publish`: `cd sdk && npm run build && npm publish --access public`
- [ ] `make dev-api`: `cd api && nodemon src/index.ts`
- [ ] `make dev-frontend`: `cd frontend && next dev`
- [ ] `make seed`: `cd contracts && forge script script/SeedTestData.s.sol --rpc-url http://localhost:8545 --broadcast`
- [ ] `make anvil`: `anvil --fork-url $$POLYGON_RPC_URL`

---

## Phase 13: Security Hardening

### 13.1 Pre-Audit Checklist
- [ ] Run `forge test --gas-report` and log gas costs for `mintMembership` and `buyMembership`
- [ ] Verify `mintMembership` gas < 200,000
- [ ] Verify `buyMembership` gas < 120,000
- [ ] Run `slither src/` and resolve all High and Medium findings
- [ ] Run `forge test --fuzz-runs 10000` (extended fuzz) on all three contracts
- [ ] Manually verify `_beforeTokenTransfer` clears user state on all transfer paths
- [ ] Verify `ReentrancyGuard` prevents attack with manual test in `Integration.t.sol`
- [ ] Verify `Ownable2Step` transfer requires two-step confirmation
- [ ] Verify all `payable` functions emit events before any external `call{value:}`
- [ ] Confirm no use of `transfer()` or `send()` — all ETH transfers use `.call{value:}("")`

### 13.2 Frontend Security
- [ ] Never store private keys in frontend — all signing via wallet adapters
- [ ] Validate all user inputs (price, token ID) before contract call
- [ ] Add `Content-Security-Policy` headers to `next.config.js`
- [ ] Use `viem`'s `parseEther` for all user-entered MATIC amounts to prevent precision issues
- [ ] Handle `UserRejectedRequestError` from wallet (user declined transaction)
- [ ] Disable "Buy" button and show spinner while `useWriteContract.isPending === true`

---

## Phase 14: Documentation & Community

### 14.1 README.md (root)
- [ ] Write project description with tagline: "Gym memberships you actually own"
- [ ] Add architecture diagram (ASCII or image)
- [ ] Add "Quick Start" section: clone, install, `make dev-frontend`
- [ ] Add contract addresses table: Network / GymRegistry / GymMembership / FlexPassMarket
- [ ] Add "How It Works" section: mint → list → buy with diagram
- [ ] Add "For Gyms" section: how to register, what royalties look like
- [ ] Add "For Members" section: how to sell, how to buy
- [ ] Add "For Kiosk Integrators" section: SDK installation and `checkAccess` example

### 14.2 contracts/README.md
- [ ] Document each contract: purpose, constructor args, key functions
- [ ] Document deployment steps with full `forge script` command
- [ ] Document Polygon Amoy testnet addresses

### 14.3 sdk/README.md
- [ ] `npm install @flexpass/verifier` instructions
- [ ] Full `checkAccess` usage example with async/await
- [ ] `VerifierConfig` interface documentation
- [ ] Offline grace period explanation

### 14.4 CONTRIBUTING.md
- [ ] Branch naming: `feat/`, `fix/`, `test/`, `docs/`
- [ ] PR requirements: tests pass, forge fmt clean, no slither high/medium
- [ ] How to run local development environment

### 14.5 SECURITY.md
- [ ] Responsible disclosure email
- [ ] Known limitations (ERC-2981 not enforced on external marketplaces — see Edge Case #10)
- [ ] Audit report link placeholder

### 14.6 devcontainer
- [ ] Create `devcontainer/Dockerfile` with Ubuntu 22.04 base
- [ ] Install Foundry: `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- [ ] Install Node.js 22 via nvm
- [ ] Install graph-cli: `npm i -g @graphprotocol/graph-cli`
- [ ] Create `docker-compose.dev.yml` with PostgreSQL 16 service and `anvil` service
- [ ] Create `.env.example` referencing docker-compose service names (`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flexpass`)
