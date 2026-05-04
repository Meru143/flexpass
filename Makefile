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
	@echo "TODO: deploy contracts to Polygon Amoy"

deploy-mainnet:
	@echo "TODO: deploy contracts to Polygon PoS"

subgraph-build:
	@echo "TODO: build The Graph subgraph"

subgraph-deploy:
	@echo "TODO: deploy The Graph subgraph"

sdk-publish:
	@echo "TODO: publish @flexpass/verifier"

dev-api:
	@echo "TODO: start Hono API dev server"

dev-frontend:
	@echo "TODO: start Next.js frontend dev server"

seed:
	@echo "TODO: seed local chain data"

anvil:
	@echo "TODO: start local Anvil fork"
