.PHONY: test lint fmt coverage deploy-amoy deploy-mainnet subgraph-build subgraph-deploy sdk-publish dev-api dev-frontend seed anvil

test:
	cd contracts && forge test -vvv

lint:
	@echo "TODO: run Solidity, TypeScript, and frontend lint checks"

fmt:
	cd contracts && forge fmt

coverage:
	cd contracts && forge coverage --report lcov

deploy-amoy:
	cd contracts && forge script script/Deploy.s.sol --rpc-url $$AMOY_RPC_URL --private-key $$DEPLOYER_PRIVATE_KEY --broadcast --verify

deploy-mainnet:
	cd contracts && forge script script/Deploy.s.sol --rpc-url $$POLYGON_RPC_URL --private-key $$DEPLOYER_PRIVATE_KEY --broadcast --verify

subgraph-build:
	cd subgraph && graph codegen && graph build

subgraph-deploy:
	cd subgraph && graph deploy flexpass -l $${SUBGRAPH_VERSION_LABEL:-v0.1.0} --deploy-key $$GRAPH_STUDIO_DEPLOY_KEY

sdk-publish:
	cd sdk && npm run build && npm publish --access public

dev-api:
	cd api && npx nodemon src/index.ts

dev-frontend:
	cd frontend && npm run dev

seed:
	cd contracts && forge script script/SeedTestData.s.sol --rpc-url http://localhost:8545 --broadcast

anvil:
	@echo "TODO: start local Anvil fork"
