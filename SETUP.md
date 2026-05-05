# FlexPass — Complete Environment Setup Guide (From Zero)

This guide walks you through setting up the FlexPass project on a brand-new Windows machine with **zero** prior configuration. Every step is explicit — nothing is assumed.

---

## Architecture Overview

FlexPass has **5 packages** that work together:

| Package | Tech Stack | Purpose |
|---|---|---|
| `contracts/` | Solidity + Foundry | Smart contracts (ERC-4907 NFTs, marketplace, gym registry) |
| `frontend/` | Next.js 14 + React 18 + TailwindCSS + RainbowKit + wagmi | User-facing dApp |
| `api/` | Hono + Prisma + PostgreSQL | REST API with DB-backed caching |
| `subgraph/` | The Graph (AssemblyScript) | On-chain event indexing |
| `sdk/` | TypeScript + viem + tsup | `@flexpass/verifier` kiosk access SDK |

```text
Frontend (Next.js) ↔ API (Hono) ↔ PostgreSQL
       ↕                ↕
   Blockchain        Subgraph (The Graph)
    (Polygon)
```

---

## Step 1: Install Prerequisites

You need **4 tools** installed globally. Everything else is handled per-package via npm.

### 1.1 — Git

Download and install Git for Windows:
- https://git-scm.com/download/win
- During install, select **"Git from the command line and also from 3rd-party software"**

Verify:
```powershell
git --version
# Expected: git version 2.x.x
```

### 1.2 — Node.js 22 (LTS)

Download and install Node.js **v22** (the project requires Node 22):
- https://nodejs.org/ → Download the **v22 LTS** installer
- Use the `.msi` installer and accept all defaults (this also installs `npm`)

Verify:
```powershell
node --version
# Expected: v22.x.x

npm --version
# Expected: 10.x.x or higher
```

### 1.3 — Foundry (Forge, Anvil, Cast)

Foundry is the Solidity development framework. Install it via PowerShell:

```powershell
# Option A: Official installer (recommended)
curl -L https://foundry.paradigm.xyz | bash

# Then restart your terminal and run:
foundryup
```

> [!NOTE]
> On Windows, if `curl` piping to `bash` doesn't work, you can install Foundry via:
> ```powershell
> # Option B: Using cargo (requires Rust)
> cargo install --git https://github.com/foundry-rs/foundry --profile release forge cast anvil
> ```
> Or download pre-built binaries from: https://github.com/foundry-rs/foundry/releases

Verify all three tools:
```powershell
forge --version
# Expected: forge 0.x.x

anvil --version
# Expected: anvil 0.x.x

cast --version
# Expected: cast 0.x.x
```

### 1.4 — Docker Desktop (for PostgreSQL + Anvil containers)

> [!TIP]
> Docker is **optional** if you install PostgreSQL directly. But Docker is the easiest path.

- Download Docker Desktop: https://www.docker.com/products/docker-desktop/
- Install and restart your machine if prompted
- Make sure WSL 2 is enabled (Docker Desktop will guide you)

Verify:
```powershell
docker --version
# Expected: Docker version 2x.x.x

docker compose version
# Expected: Docker Compose version v2.x.x
```

### 1.5 — GNU Make (Optional but recommended)

The project uses a `Makefile` for common commands. On Windows, you can install Make via:

```powershell
# Option A: Using winget
winget install GnuWin32.Make

# Option B: Using Chocolatey
choco install make

# Option C: Using Scoop
scoop install make
```

Verify:
```powershell
make --version
# Expected: GNU Make 4.x
```

> [!NOTE]
> If you don't want to install Make, you can run the underlying commands directly (shown in each step below).

---

## Step 2: Clone the Repository

```powershell
git clone https://github.com/Meru143/flexpass.git
cd flexpass
```

### Initialize Git Submodules

The contracts use `forge-std` and `openzeppelin-contracts` as Git submodules:

```powershell
git submodule update --init --recursive
```

Verify submodules are populated:
```powershell
ls contracts/lib/forge-std
ls contracts/lib/openzeppelin-contracts
# Both should contain files, not be empty
```

---

## Step 3: Configure Environment Variables

### 3.1 — Root `.env` File

Copy the example and fill in your values:

```powershell
Copy-Item .env.example .env
```

Open `.env` in your editor and configure:

```env
# ─── Blockchain RPC URLs ───
# Get free RPC endpoints from https://www.alchemy.com/ or https://www.infura.io/
POLYGON_RPC_URL=<YOUR_ALCHEMY_OR_INFURA_RPC_URL>        # 🔑 SECRET — get from Alchemy/Infura
AMOY_RPC_URL=<YOUR_ALCHEMY_OR_INFURA_RPC_URL>            # 🔑 SECRET — same as above
ANVIL_RPC_URL=http://localhost:8545                       # ✅ public

# ─── Deployer Wallet ───
# NEVER use a wallet with real mainnet funds for testing!
# Create a new MetaMask wallet, export the private key (without 0x prefix)
DEPLOYER_PRIVATE_KEY=<YOUR_64_CHAR_HEX_PRIVATE_KEY>      # 🔑 SECRET — never share this

# ─── Protocol Treasury ───
# The wallet address that receives protocol fees (public on-chain)
PROTOCOL_TREASURY=0xBA9FDDaA4346C3aE7903B8bf931C007422DBd941  # ✅ public

# ─── Block Explorer Verification ───
# Get from https://polygonscan.com/myapikey
POLYGONSCAN_API_KEY=<YOUR_POLYGONSCAN_API_KEY>            # 🔑 SECRET

# ─── IPFS / Pinata (for NFT metadata) ───
# Sign up at https://www.pinata.cloud/ → API Keys → New Key
PINATA_JWT=<YOUR_PINATA_JWT_TOKEN>                        # 🔑 SECRET

# ─── The Graph Studio ───
# Get from https://thegraph.com/studio/ → Deploy Key
GRAPH_STUDIO_DEPLOY_KEY=<YOUR_GRAPH_DEPLOY_KEY>           # 🔑 SECRET

# ─── WalletConnect (for frontend wallet connections) ───
# Sign up at https://cloud.walletconnect.com/ → New Project → Copy Project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<YOUR_WALLETCONNECT_PROJECT_ID>  # 🔑 SECRET

# ─── Subgraph & Contract Addresses (all public, already on-chain) ───
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/1749319/flexpass/v0.1.0  # ✅ public
NEXT_PUBLIC_CHAIN_ID=80002                                # ✅ public
NEXT_PUBLIC_GYM_MEMBERSHIP_ADDRESS=0x465CF3a5918534d94BA62F3A7980f5ffB0277168  # ✅ public
NEXT_PUBLIC_MARKET_ADDRESS=0x0e9a4999ABcccE5B1A6989B34Ed549C2Dd72bfC0          # ✅ public
NEXT_PUBLIC_GYM_REGISTRY_ADDRESS=0xaE12edE4Eab2655b9B1618628c678819693881eA    # ✅ public

# ─── Database (local dev defaults) ───
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flexpass          # ✅ public (local dev)
DATABASE_URL_DOCKER=postgresql://postgres:postgres@postgres:5432/flexpass    # ✅ public (local dev)

# ─── Optional ───
COINGECKO_API_KEY=                                        # 🔑 SECRET (optional)
WEBHOOK_HMAC_SECRET=                                      # 🔑 SECRET (optional)
```

### 3.2 — Frontend `.env.local`

```powershell
Copy-Item frontend/.env.example frontend/.env.local
```

Fill in `frontend/.env.local`:
```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<YOUR_WALLETCONNECT_PROJECT_ID>          # 🔑 SECRET — only value you must add
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/1749319/flexpass/v0.1.0  # ✅ pre-filled
NEXT_PUBLIC_CHAIN_ID=80002                                                     # ✅ pre-filled
NEXT_PUBLIC_GYM_MEMBERSHIP_ADDRESS=0x465CF3a5918534d94BA62F3A7980f5ffB0277168   # ✅ pre-filled
NEXT_PUBLIC_MARKET_ADDRESS=0x0e9a4999ABcccE5B1A6989B34Ed549C2Dd72bfC0           # ✅ pre-filled
NEXT_PUBLIC_GYM_REGISTRY_ADDRESS=0xaE12edE4Eab2655b9B1618628c678819693881eA     # ✅ pre-filled
```

### 3.3 — API `.env`

```powershell
Copy-Item api/.env.example api/.env
```

Fill in `api/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flexpass              # ✅ pre-filled
POLYGON_RPC_URL=<YOUR_ALCHEMY_OR_INFURA_RPC_URL>                                # 🔑 SECRET
GYM_MEMBERSHIP_ADDRESS=0x465CF3a5918534d94BA62F3A7980f5ffB0277168                # ✅ pre-filled
REGISTRY_ADDRESS=0xaE12edE4Eab2655b9B1618628c678819693881eA                      # ✅ pre-filled
DEPLOYER_PRIVATE_KEY=<YOUR_64_CHAR_HEX_PRIVATE_KEY>                              # 🔑 SECRET
NEXT_PUBLIC_CHAIN_ID=80002                                                       # ✅ pre-filled
SUBGRAPH_URL=https://api.studio.thegraph.com/query/1749319/flexpass/v0.1.0       # ✅ pre-filled
PINATA_JWT=<YOUR_PINATA_JWT_TOKEN>                                               # 🔑 SECRET
COINGECKO_API_KEY=                                                               # 🔑 SECRET (optional)
WEBHOOK_HMAC_SECRET=                                                             # 🔑 SECRET (optional)
```

---

## Step 4: Get API Keys & Accounts

Here's where to get each key/account you need:

| Service | URL | What You Get | Required For |
|---|---|---|---|
| **Alchemy** | https://www.alchemy.com/ | RPC URL for Polygon Amoy | Blockchain reads/writes |
| **MetaMask** | https://metamask.io/ | Wallet + Private Key | Deploying contracts, testing |
| **PolygonScan** | https://polygonscan.com/myapikey | API Key | Contract verification |
| **Pinata** | https://www.pinata.cloud/ | JWT Token | IPFS metadata uploads |
| **WalletConnect** | https://cloud.walletconnect.com/ | Project ID | Frontend wallet connections |
| **The Graph Studio** | https://thegraph.com/studio/ | Deploy Key | Subgraph deployment |

> [!IMPORTANT]
> **For local-only development** (no testnet), you only need: **WalletConnect Project ID** (free). Everything else can be skipped if you use Anvil as your local chain.

### Get Test MATIC (for Polygon Amoy Testnet)

If you plan to deploy to the Amoy testnet, get free test MATIC:
- https://faucet.polygon.technology/ — Select "Amoy" network
- Send to your deployer wallet address

---

## Step 5: Install Dependencies

Run these from the project root (`flexpass/`):

```powershell
# Frontend (Next.js + React + wagmi + RainbowKit)
cd frontend; npm install; cd ..

# API (Hono + Prisma)
cd api; npm install; cd ..

# Subgraph (The Graph CLI)
cd subgraph; npm install; cd ..

# SDK (@flexpass/verifier)
cd sdk; npm install; cd ..
```

### Install Foundry Dependencies (Contracts)

The Solidity libs should already be present from the git submodule step, but verify:

```powershell
cd contracts
forge install
cd ..
```

---

## Step 6: Set Up the Database (PostgreSQL)

### Option A: Using Docker (Recommended)

```powershell
docker compose -f docker-compose.dev.yml up -d postgres
```

This starts a PostgreSQL 16 container with:
- **User**: `postgres`
- **Password**: `postgres`
- **Database**: `flexpass`
- **Port**: `5432`

Verify it's running:
```powershell
docker ps
# Should show flexpass-postgres running on port 5432
```

### Option B: Install PostgreSQL Directly

1. Download from https://www.postgresql.org/download/windows/
2. Install with default settings
3. During install, set password to `postgres`
4. After install, create the database:

```powershell
# Using psql (included with PostgreSQL)
psql -U postgres
```
```sql
CREATE DATABASE flexpass;
\q
```

### Run Prisma Migrations

Once PostgreSQL is running, apply the database schema:

```powershell
cd api
npx prisma migrate dev
cd ..
```

This creates the `Gym`, `MembershipCache`, and `EntryEvent` tables.

> [!TIP]
> You can inspect the database with Prisma Studio:
> ```powershell
> cd api
> npx prisma studio
> ```
> This opens a browser-based DB viewer at `http://localhost:5555`.

---

## Step 7: Compile & Test Smart Contracts

```powershell
cd contracts

# Compile all Solidity contracts
forge build

# Run the full test suite
forge test -vvv

# Check formatting
forge fmt --check

# Generate code coverage
forge coverage --report lcov

cd ..
```

Or using the Makefile:
```powershell
make test
make lint
make coverage
```

---

## Step 8: Start the Local Blockchain (Anvil)

### Option A: Standalone Anvil (no fork)

```powershell
# In a NEW terminal window:
anvil --chain-id 31337
```

This gives you 10 pre-funded accounts with 10,000 ETH each. The first account's private key is printed in the terminal.

### Option B: Fork Polygon Amoy

```powershell
# Requires POLYGON_RPC_URL in your .env
make anvil
# Or directly:
anvil --fork-url https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
```

### Option C: Using Docker

```powershell
docker compose -f docker-compose.dev.yml up -d anvil
```

### Seed Demo Data to Local Chain

With Anvil running in another terminal:

```powershell
make seed
# Or directly:
cd contracts && forge script script/SeedTestData.s.sol --rpc-url http://localhost:8545 --broadcast
```

> [!NOTE]
> `make seed` deploys fresh contract instances to your local Anvil and registers demo gyms/memberships. The addresses are printed in the console output — you'll need to update your `.env` files if you want the frontend to point to these local contracts.

---

## Step 9: Start the API Server

```powershell
# In a NEW terminal window:
make dev-api

# Or directly:
cd api && npx nodemon src/index.ts
```

> [!IMPORTANT]
> The API requires PostgreSQL to be running (Step 6) and Prisma migrations applied. Make sure `DATABASE_URL` in `api/.env` points to your running Postgres instance.

---

## Step 10: Start the Frontend

```powershell
# In a NEW terminal window:
make dev-frontend

# Or directly:
cd frontend && npm run dev
```

The frontend starts at **http://localhost:3000**.

### Connect Your Wallet

1. Open http://localhost:3000 in your browser
2. Install the **MetaMask** browser extension if you haven't
3. Add the **Polygon Amoy** testnet to MetaMask:
   - Network Name: `Polygon Amoy Testnet`
   - RPC URL: `https://rpc-amoy.polygon.technology`
   - Chain ID: `80002`
   - Currency: `MATIC`
   - Explorer: `https://amoy.polygonscan.com/`
4. For **local Anvil**: add a custom network:
   - Network Name: `Anvil Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency: `ETH`
5. Click "Connect Wallet" in the dApp

---

## Step 11: Build the SDK (Optional)

Only needed if you're developing kiosk/verifier integrations:

```powershell
cd sdk
npm run build
cd ..
```

This outputs to `sdk/dist/` with CJS, ESM, and type declarations.

---

## Step 12: Build & Deploy the Subgraph (Optional)

Only needed if you're modifying the subgraph or deploying a new one:

```powershell
# Build
cd subgraph
npm run codegen
npm run build

# Deploy to The Graph Studio (requires GRAPH_STUDIO_DEPLOY_KEY)
npm run deploy
cd ..
```

Or via Makefile:
```powershell
make subgraph-build
make subgraph-deploy
```

---

## Quick Reference: All Running Services

When fully operational, you should have these running in separate terminals:

| Terminal | Command | URL |
|---|---|---|
| 1 | `anvil --chain-id 31337` | `http://localhost:8545` |
| 2 | `docker compose -f docker-compose.dev.yml up postgres` | `localhost:5432` |
| 3 | `cd api && npx nodemon src/index.ts` | `http://localhost:3000` (API) |
| 4 | `cd frontend && npm run dev` | `http://localhost:3000` (Frontend) |

---

## Troubleshooting

### `forge: command not found`
Foundry isn't in your PATH. Re-run `foundryup` and restart your terminal. On Windows, you may need to manually add `%USERPROFILE%\.foundry\bin` to your system PATH.

### `npm install` fails with node-gyp errors
Make sure you have Node.js 22 (not older). Run `node --version` to verify. You may also need the Windows Build Tools:
```powershell
npm install -g windows-build-tools
```

### Prisma migration fails with "Can't reach database server"
- Ensure PostgreSQL is running: `docker ps` or check the service
- Verify `DATABASE_URL` in `api/.env` matches your DB credentials
- Default: `postgresql://postgres:postgres@localhost:5432/flexpass`

### `git submodule update` shows empty directories
Run:
```powershell
git submodule update --init --recursive --force
```

### Anvil exits immediately
- Port 8545 may be in use. Kill the process: `npx kill-port 8545`
- Or use a different port: `anvil --port 8546`

### Frontend shows "WalletConnect Project ID is required"
You need a WalletConnect Project ID in `frontend/.env.local`. Get one free at https://cloud.walletconnect.com/.

### MetaMask shows "Chain not supported"
Add the correct network (Polygon Amoy or Anvil Local) to MetaMask as described in Step 10.

### `make` is not recognized
Install Make (Step 1.5) or run the underlying commands directly — each `make` target's actual command is shown in this guide.

---

## Deploying to Polygon Amoy Testnet

Once everything works locally:

```powershell
# 1. Make sure AMOY_RPC_URL and DEPLOYER_PRIVATE_KEY are set in .env
# 2. Get test MATIC from https://faucet.polygon.technology/

# 3. Deploy contracts
make deploy-amoy
# Or:
cd contracts && forge script script/Deploy.s.sol --rpc-url $AMOY_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast --verify

# 4. Note the deployed addresses from the console output
# 5. Update .env files with the new contract addresses
# 6. Deploy the subgraph
make subgraph-deploy
```

---

## Summary Checklist

- [ ] Git installed
- [ ] Node.js 22 installed
- [ ] Foundry (forge, anvil, cast) installed
- [ ] Docker Desktop installed
- [ ] Repository cloned with submodules
- [ ] Root `.env` configured
- [ ] `frontend/.env.local` configured
- [ ] `api/.env` configured
- [ ] All npm packages installed (frontend, api, subgraph, sdk)
- [ ] PostgreSQL running (Docker or native)
- [ ] Prisma migrations applied
- [ ] Contracts compile (`forge build`)
- [ ] Contract tests pass (`forge test -vvv`)
- [ ] Anvil running on port 8545
- [ ] Demo data seeded (`make seed`)
- [ ] API server running
- [ ] Frontend running at localhost:3000
- [ ] Wallet connected via MetaMask
