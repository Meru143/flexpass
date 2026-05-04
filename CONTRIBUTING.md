# Contributing

FlexPass changes should stay aligned with the PRD and phased TODO. Contracts are the source of truth for membership state, royalties, and marketplace settlement; frontend, API, subgraph, and SDK changes should preserve those on-chain interfaces.

## Branch Naming

Use a short branch name with one of the supported prefixes.

```text
feat/<description>
fix/<description>
test/<description>
docs/<description>
```

Examples are `feat/market-buy-flow`, `fix/user-expiry-cache`, `test/royalty-distribution`, and `docs/sdk-verifier`.

## Pull Requests

Every PR should describe the user-visible behavior, list the packages touched, and include the verification commands that passed locally. Contract PRs must pass `forge test -vvv`, `forge fmt --check`, and Slither with no High or Medium findings. Frontend PRs must pass `npx eslint .`, `npx tsc --noEmit`, and `npx vitest run` from `frontend/`.

Do not include secrets, private keys, RPC credentials, deployer mnemonics, `.env` files, or generated wallet material. Use `.env.example` for required variable names and keep live values in the local shell, GitHub Actions secrets, or a secret manager.

## Local Development

Install Foundry and Node.js 22. Install package dependencies in each JavaScript workspace.

```powershell
cd frontend; npm install; cd ..
cd api; npm install; cd ..
cd subgraph; npm install; cd ..
cd sdk; npm install; cd ..
```

Copy the example environment file and fill only the values needed for the package you are running.

```powershell
Copy-Item .env.example .env
```

Start the frontend with the Makefile target.

```powershell
make dev-frontend
```

Run the API and local chain in separate terminals when working on end-to-end flows.

```powershell
make dev-api
anvil --chain-id 31337
make seed
```

Docker users can start the supporting database and Anvil services with:

```powershell
docker compose -f docker-compose.dev.yml up -d
```

